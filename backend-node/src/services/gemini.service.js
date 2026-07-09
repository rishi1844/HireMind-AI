// src/services/gemini.service.js — Uses official @google/generative-ai SDK
// 100% AI-driven — no static fallbacks
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const MAX_RETRIES = parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.GEMINI_INITIAL_BACKOFF_MS || '1200', 10);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');
  return new GoogleGenerativeAI(apiKey);
}

// ─── Core call with retry ─────────────────────────────────────────────────────
async function callGemini(prompt, json = true) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const totalAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text || text.trim() === '') throw new Error('Gemini returned empty response.');
      logger.info(`[Gemini] Got response (${text.length} chars)`);
      return text;
    } catch (err) {
      lastError = err;
      const isRetryable = isRetryableError(err);
      if (!isRetryable || attempt >= totalAttempts) break;
      const delay = calculateBackoffDelay(attempt);
      logger.warn(`Gemini attempt ${attempt}/${totalAttempts} failed: ${err.message}. Retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }

  throw new Error(
    lastError?.message?.includes('429') || lastError?.message?.includes('quota')
      ? 'Gemini API quota exceeded for today. Please switch to GPT or try again tomorrow.'
      : lastError?.message || 'Gemini AI is temporarily unavailable. Please try again or switch to GPT.'
  );
}

function isRetryableError(err) {
  const msg = (err.message || '').toLowerCase();
  // 429 quota exhausted is NOT retryable — it won't recover in seconds
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) return false;
  return msg.includes('503') || msg.includes('unavailable') ||
    msg.includes('try again') || msg.includes('internal');
}

function calculateBackoffDelay(attempt) {
  const exp = INITIAL_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 400) + 200;
  return Math.min(exp + jitter, 6000);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Robust JSON extractor ────────────────────────────────────────────────────
function extractJson(text) {
  let clean = (text || '').trim();
  // Strip markdown code blocks
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  // Find first { and last }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.slice(start, end + 1);
  }
  return clean;
}

// ─── Analyze Resume ───────────────────────────────────────────────────────────
async function analyzeResume(resumeText) {
  if (!resumeText || resumeText.trim().length < 100) {
    const err = new Error('Resume text is too short or empty. Please upload a valid, text-based PDF.');
    err.status = 400;
    throw err;
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) engine and senior technical recruiter.
Carefully read the resume below and provide a comprehensive, ACCURATE analysis.
You MUST respond with ONLY a valid JSON object — no markdown, no explanation text, nothing else.

Resume:
${resumeText}

IMPORTANT RULES:
- Do NOT use fixed numbers of points. Generate as many strengths, weaknesses, improvements, jobRoles, and projectSuggestions as are GENUINELY relevant for THIS specific resume.
- If the resume has only 2 real strengths, return exactly 2. If it has 7, return 7. Quality over quantity.
- Every point must be specific to this resume — no generic filler.
- atsScore must honestly reflect the actual quality. Do not inflate or deflate artificially.

Respond with EXACTLY this JSON structure (all arrays can have any length >= 1, no other text):
{
  "atsScore": <integer 0-100>,
  "strengths": ["specific strength based on this resume"],
  "weaknesses": ["specific weakness based on this resume"],
  "improvements": ["specific, actionable improvement tip"],
  "jobRoles": ["role that genuinely fits this resume"],
  "projectSuggestions": ["portfolio project idea that strengthens this profile"],
  "quickPractice": [
    {"question": "tailored interview question 1", "sampleAnswer": "answer text"},
    {"question": "tailored interview question 2", "sampleAnswer": "answer text"},
    {"question": "tailored interview question 3", "sampleAnswer": "answer text"}
  ]
}`;

  const raw = await callGemini(prompt, true);
  return extractJson(raw);
}

// ─── Generate Interview Questions ─────────────────────────────────────────────
async function generateInterviewQuestions(resumeText, resumeContext, candidateName, skills, description, count) {
  const prompt = `You are a senior interviewer preparing a tailored interview question set.
You MUST respond with ONLY a valid JSON object — no other text.

Candidate: ${candidateName}
Skills: ${skills}
Background/Job Description: ${description}
Resume Summary: ${resumeContext}
Resume Text (first 2000 chars): ${resumeText ? resumeText.slice(0, 2000) : 'Not provided'}

STEP 1 — Detect the candidate's domain:
Based on their resume, skills, and background, identify the candidate's primary domain. Examples:
- Technical (Software, Engineering, Data, IT, DevOps, etc.)
- Sales / BPO / Customer Support
- Marketing / Digital Marketing
- HR / People Management
- Finance / Accounting
- Operations / Management
- Healthcare
- Education
- Any other relevant domain

STEP 2 — Generate ${count} interview questions with domain-appropriate category labels:
- For TECHNICAL candidates: use category labels like "Technical", "Projects", "System Design", "Problem Solving", "HR"
- For SALES/BPO candidates: use labels like "Sales Techniques", "Client Handling", "Communication", "Target Achievement", "HR"
- For MARKETING candidates: use labels like "Strategy", "Campaigns", "Analytics", "Brand", "HR"
- For HR candidates: use labels like "Recruitment", "HR Processes", "People Management", "Conflict Resolution", "HR"
- For other domains: generate the most relevant category labels for that specific role — do NOT use technical labels for non-technical candidates
- Always include 1-2 general HR/behavioral questions in any domain
- Questions must be specific to the candidate's actual background and experience — no generic filler

Respond with EXACTLY this JSON (no other text):
{
  "detectedDomain": "<e.g. Software Engineering, Sales, Marketing, HR, etc.>",
  "questions": [
    {"question": "specific tailored question", "type": "<CATEGORY_LABEL>"},
    {"question": "specific tailored question", "type": "<CATEGORY_LABEL>"}
  ]
}

Generate exactly ${count} questions. Make every question specific to this candidate.`;

  const raw = await callGemini(prompt, true);
  return extractJson(raw);
}

// ─── Evaluate Answer ──────────────────────────────────────────────────────────
async function evaluateAnswer(question, answer, resumeContext) {
  const prompt = `You are a senior technical interviewer evaluating a candidate's answer.
You MUST respond with ONLY a valid JSON object — no other text.

Question: ${question}
Answer: ${answer}
Candidate Background: ${resumeContext}

Respond with EXACTLY this JSON (no other text):
{
  "score": <number from 0.0 to 10.0>,
  "strengths": "what the candidate did well in this specific answer",
  "weaknesses": "what was missing or could be improved in this answer",
  "improvedAnswer": "a comprehensive model answer for this question"
}`;

  const raw = await callGemini(prompt, true);
  return extractJson(raw);
}

// ─── Resume Summary ───────────────────────────────────────────────────────────
async function generateResumeSummary(name, skills, experienceInput, targetRole) {
  const prompt = `Write a 3-4 sentence ATS-optimized professional resume summary. Plain text only, no bullets or markdown.

Name: ${name || 'Not provided'}
Skills: ${skills || 'Not provided'}
Experience: ${experienceInput || 'Not provided'}
Target Role: ${targetRole || 'Not provided'}

Write the professional summary:`;

  return callGemini(prompt, false);
}

// ─── Experience Bullets ───────────────────────────────────────────────────────
async function generateExperienceBullets(company, role, duration, existingDescription) {
  const prompt = `Write exactly 3 powerful, ATS-optimized resume bullet points for this work experience.
Plain text only. Start each bullet with "- ".

Company: ${company || 'Not provided'}
Role: ${role || 'Not provided'}
Duration: ${duration || 'Not provided'}
Notes: ${existingDescription || 'Not provided'}

Write 3 bullet points:`;

  return callGemini(prompt, false);
}

// ─── Project Description ──────────────────────────────────────────────────────
async function generateProjectDescription(projectTitle, techStack, existingDescription) {
  const prompt = `Write exactly 2 concise, ATS-friendly project bullet points.
Plain text only. Start each bullet with "- ".

Project: ${projectTitle || 'Not provided'}
Tech Stack: ${techStack || 'Not provided'}
Notes: ${existingDescription || 'Not provided'}

Write 2 bullet points:`;

  return callGemini(prompt, false);
}

// ─── Full Resume ──────────────────────────────────────────────────────────────
async function generateFullResume(name, skills, experienceInput) {
  const prompt = `Generate professional resume starter content. Respond with ONLY a valid JSON object — no other text.

Name: ${name || 'Not provided'}
Skills: ${skills || 'Not provided'}
Experience: ${experienceInput || 'Not provided'}

Respond with EXACTLY this JSON:
{
  "summary": "3-4 sentence professional summary",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "duration": "time period",
      "description": "- bullet one\\n- bullet two\\n- bullet three"
    }
  ],
  "projects": [
    {
      "title": "project name",
      "techStack": "technologies",
      "description": "- bullet one\\n- bullet two"
    }
  ]
}`;

  const raw = await callGemini(prompt, true);
  return extractJson(raw);
}

module.exports = {
  analyzeResume,
  generateInterviewQuestions,
  evaluateAnswer,
  generateResumeSummary,
  generateExperienceBullets,
  generateProjectDescription,
  generateFullResume,
};
