// src/services/jobMatch.service.js — Job Description Matcher (Phase 3.2)
const prisma = require('../config/db');
const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const { checkUsageLimit } = require('./usageLimit.service');


const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set in .env');
  return new OpenAI({ apiKey });
}

function extractJson(text) {
  let clean = (text || '').trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) clean = clean.slice(start, end + 1);
  return clean;
}

/**
 * Match a resume against a job description.
 * Returns match%, missing keywords, tailoring tips, and section scores.
 */
async function analyzeJobMatch(body, userEmail) {
  const { resumeId, jobDescription } = body;

  if (!resumeId || !jobDescription) {
    const err = new Error('resumeId and jobDescription are required.');
    err.status = 400;
    throw err;
  }

  const resume = await prisma.resume.findUnique({
    where: { id: BigInt(resumeId) },
    include: { user: true },
  });
  if (!resume) throw new Error('Resume not found');
  if (resume.user.email !== userEmail) throw new Error('Unauthorized');

  // Enforce Free plan limit
  await checkUsageLimit(userEmail, 'job_match');

  const resumeText = resume.extractedText || '';

  const prompt = `You are a senior ATS recruiter and resume expert. Analyze how well this resume matches the given job description.
Respond with ONLY valid JSON — no markdown, no extra text.

Job Description:
${jobDescription.slice(0, 3000)}

Resume:
${resumeText.slice(0, 3000)}

Return EXACTLY this JSON:
{
  "matchScore": <integer 0-100 representing overall match percentage>,
  "verdict": "<one of: Excellent Match | Good Match | Partial Match | Weak Match>",
  "summary": "<2-3 sentence overall assessment>",
  "matchedKeywords": ["keyword1", "keyword2", "keyword3"],
  "missingKeywords": ["missing1", "missing2", "missing3", "missing4"],
  "sectionScores": {
    "skills": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "keywords": <0-100>
  },
  "tailoringTips": [
    "Specific actionable tip 1 to improve match",
    "Specific actionable tip 2 to improve match",
    "Specific actionable tip 3 to improve match",
    "Specific actionable tip 4 to improve match"
  ]
}`;

  const client = getClient();
  const response = await client.chat.completions.create({
    model: GPT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an ATS expert. Respond with ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 1500,
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI returned empty response.');

  const parsed = JSON.parse(extractJson(raw));

  // Track token usage (fire-and-forget)
  try {
    if (response.usage) {
      await prisma.tokenUsage.create({
        data: {
          userId: resume.user.id,
          model: 'gpt',
          feature: 'job_match',
          promptTokens: response.usage.prompt_tokens || 0,
          completionTokens: response.usage.completion_tokens || 0,
          totalTokens: response.usage.total_tokens || 0,
        },
      });
    }
  } catch (e) {
    logger.warn(`[JobMatch] Token tracking failed: ${e.message}`);
  }

  logger.info(`[JobMatch] Analyzed for ${userEmail} — score=${parsed.matchScore} tokens=${response.usage?.total_tokens || '?'}`);

  return {
    resumeId: resume.id.toString(),
    fileName: resume.fileName,
    ...parsed,
    analyzedAt: new Date().toISOString(),
  };
}

module.exports = { analyzeJobMatch };
