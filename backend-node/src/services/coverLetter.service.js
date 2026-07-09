// src/services/coverLetter.service.js — AI Cover Letter Generator (Phase 3.1)
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

/**
 * Generate a tailored cover letter.
 * @param {object} body - { resumeId?, jobTitle, companyName, jobDescription, tone }
 * @param {string} userEmail
 */
async function generateCoverLetter(body, userEmail) {
  const { jobTitle, companyName, jobDescription, tone = 'professional' } = body;

  if (!jobTitle || !companyName || !jobDescription) {
    const err = new Error('jobTitle, companyName, and jobDescription are required.');
    err.status = 400;
    throw err;
  }

  // Enforce Free plan limit
  await checkUsageLimit(userEmail, 'cover_letter');

  let resumeText = '';
  let candidateName = '';
  let resumeDomain = '';

  // If resumeId provided, load extracted text from DB
  if (body.resumeId) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) throw new Error('User not found');

    const resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true, analysisResult: true },
    });
    if (!resume) throw new Error('Resume not found');
    if (resume.user.email !== userEmail) throw new Error('Unauthorized');

    resumeText = resume.extractedText || '';
    candidateName = user.name || '';

    // Detect resume domain from analysis jobRoles if available
    if (resume.analysisResult?.jobRoles) {
      try {
        const roles = JSON.parse(resume.analysisResult.jobRoles);
        if (Array.isArray(roles) && roles.length > 0) resumeDomain = roles.slice(0, 3).join(', ');
      } catch { /* ignore */ }
    }
  }

  const toneGuide = {
    professional: 'formal, polished, and professional',
    enthusiastic: 'energetic, passionate, and enthusiastic while staying professional',
    concise: 'concise, direct, and impactful — under 250 words',
  };

  // ── Mismatch Detection ────────────────────────────────────────────────────────
  // Ask AI to detect if resume background and job description are mismatched
  const prompt = `You are a professional career coach and cover letter expert.
Analyze the fit between the candidate's resume and the job description, then write a compelling cover letter.
Respond with ONLY valid JSON — no markdown, no extra text.

Tone: ${toneGuide[tone] || toneGuide.professional}

Candidate Name: ${candidateName || 'the applicant'}
${resumeDomain ? `Candidate's Background Domain: ${resumeDomain}` : ''}
Job Title: ${jobTitle}
Company: ${companyName}

=== JOB DESCRIPTION (use this as the PRIMARY source for tailoring) ===
${jobDescription}

${resumeText ? `=== CANDIDATE RESUME / BACKGROUND (use this to pull specific experiences, skills, and achievements) ===\n${resumeText.slice(0, 3000)}` : ''}

COVER LETTER INSTRUCTIONS:
- Open with a strong hook mentioning the specific role and company from the JD
- Map the candidate's actual skills/experiences directly to requirements mentioned in the JD
- Show genuine interest referencing specific responsibilities or requirements from the JD
- Close with a confident call to action
- Keep it to 3-4 paragraphs, roughly 300-400 words
- Plain text only — no markdown, no brackets, no placeholders
- If resume background exists, extract specific achievements and numbers to make it personal

Respond with EXACTLY this JSON:
{
  "coverLetter": "<the full plain-text cover letter>",
  "isMismatch": <true if the resume background seems significantly different from the job domain, false otherwise>,
  "mismatchReason": "<1 sentence explaining the mismatch, or empty string if no mismatch>"
}`;

  const client = getClient();
  const response = await client.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      { role: 'system', content: 'You are an expert cover letter writer. Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.75,
    max_tokens: 1000,
  });

  let parsed;
  try {
    const raw = response.choices?.[0]?.message?.content?.trim() || '';
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('AI returned an invalid response. Please try again.');
  }

  const coverLetter = parsed.coverLetter?.trim();
  if (!coverLetter) throw new Error('AI returned an empty cover letter.');

  // Track token usage (fire-and-forget)
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user && response.usage) {
      await prisma.tokenUsage.create({
        data: {
          userId: user.id,
          model: 'gpt',
          feature: 'cover_letter',
          promptTokens: response.usage.prompt_tokens || 0,
          completionTokens: response.usage.completion_tokens || 0,
          totalTokens: response.usage.total_tokens || 0,
        },
      });
    }
  } catch (e) {
    logger.warn(`[CoverLetter] Token tracking failed: ${e.message}`);
  }

  logger.info(`[CoverLetter] Generated for ${userEmail} — ${response.usage?.total_tokens || '?'} tokens | mismatch=${parsed.isMismatch}`);

  return {
    coverLetter,
    jobTitle,
    companyName,
    tone,
    isMismatch: parsed.isMismatch === true,
    mismatchReason: parsed.mismatchReason || '',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateCoverLetter };
