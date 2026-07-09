// src/services/ai.service.js — Unified AI router
// GPT (OpenAI) is the ONLY supported provider. Gemini is disabled.
// NO static fallbacks — if AI fails, an error is thrown to the user.
const openaiService = require('./openai.service');
const logger = require('../utils/logger');

/**
 * Resolve which AI provider to use.
 * Always returns 'gpt' — Gemini is disabled platform-wide.
 */
function resolveProvider(_aiModel) {
  return 'gpt';
}

function getService(_aiModel) {
  logger.info('[AI] Using provider: GPT (OpenAI)');
  return openaiService;
}

// ─── Analyze Resume ───────────────────────────────────────────────────────────
async function analyzeResume(resumeText, aiModel, userId = null, force = false) {
  return getService(aiModel).analyzeResume(resumeText, userId, force);
}

// ─── Generate Interview Questions ─────────────────────────────────────────────
async function generateInterviewQuestions(resumeText, resumeContext, candidateName, skills, description, count, aiModel, userId = null, difficulty = 'medium') {
  return getService(aiModel).generateInterviewQuestions(resumeText, resumeContext, candidateName, skills, description, count, userId, null, difficulty);
}

// ─── Generate Targeted Interview Questions ────────────────────────────────────
async function generateTargetedInterviewQuestions(jobTitle, companyName, jobDescription, resumeText, count, aiModel, userId = null) {
  return getService(aiModel).generateTargetedInterviewQuestions(jobTitle, companyName, jobDescription, resumeText, count, userId);
}

// ─── Evaluate Answer ──────────────────────────────────────────────────────────
async function evaluateAnswer(question, answer, resumeContext, aiModel, userId = null) {
  return getService(aiModel).evaluateAnswer(question, answer, resumeContext, userId);
}

// ─── Evaluate Targeted Answer ──────────────────────────────────────────────────
async function evaluateTargetedAnswer(question, answer, jobTitle, companyName, jobDescription, resumeText, aiModel, userId = null) {
  return getService(aiModel).evaluateTargetedAnswer(question, answer, jobTitle, companyName, jobDescription, resumeText, userId);
}

// ─── Evaluate Targeted Session ─────────────────────────────────────────────────
async function evaluateTargetedSession(jobTitle, companyName, jobDescription, resumeText, qaList, aiModel, userId = null) {
  return getService(aiModel).evaluateTargetedSession(jobTitle, companyName, jobDescription, resumeText, qaList, userId);
}

// ─── Resume Summary ───────────────────────────────────────────────────────────
async function generateResumeSummary(name, skills, experienceInput, targetRole, aiModel) {
  return getService(aiModel).generateResumeSummary(name, skills, experienceInput, targetRole);
}

// ─── Experience Bullets ───────────────────────────────────────────────────────
async function generateExperienceBullets(company, role, duration, existingDescription, aiModel) {
  return getService(aiModel).generateExperienceBullets(company, role, duration, existingDescription);
}

// ─── Project Description ──────────────────────────────────────────────────────
async function generateProjectDescription(projectTitle, techStack, existingDescription, aiModel) {
  return getService(aiModel).generateProjectDescription(projectTitle, techStack, existingDescription);
}

// ─── Full Resume ──────────────────────────────────────────────────────────────
async function generateFullResume(name, skills, experienceInput, aiModel, projectsInput = '') {
  return getService(aiModel).generateFullResume(name, skills, experienceInput, null, projectsInput);
}

module.exports = {
  resolveProvider,
  analyzeResume,
  generateInterviewQuestions,
  generateTargetedInterviewQuestions,
  evaluateAnswer,
  evaluateTargetedAnswer,
  evaluateTargetedSession,
  generateResumeSummary,
  generateExperienceBullets,
  generateProjectDescription,
  generateFullResume,
};
