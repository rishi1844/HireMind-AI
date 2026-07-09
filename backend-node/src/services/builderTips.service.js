// src/services/builderTips.service.js — Real-time Resume Builder Tips (Phase 3.3)
const { OpenAI } = require('openai');
const logger = require('../utils/logger');

const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // cheaper model for tips

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set in .env');
  return new OpenAI({ apiKey });
}

function extractJson(text) {
  let clean = (text || '').trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
  return clean;
}

const STEP_GUIDES = {
  basics: 'name, contact details, LinkedIn, GitHub, and portfolio link',
  summary: 'professional summary / headline',
  education: 'education history (degrees, institutions, years, GPA)',
  experience: 'work experience (company, role, dates, bullet-point achievements)',
  projects: 'portfolio projects (title, tech stack, impact)',
  skills: 'technical and soft skills',
  custom: 'additional sections (certifications, awards, publications)',
};

/**
 * Generate contextual tips for the current builder step.
 * @param {object} body - { step, resumeData }
 */
async function generateBuilderTips(body) {
  const { step = 'basics', resumeData = {} } = body;

  if (!STEP_GUIDES[step]) {
    return { tips: ['Fill in your details to get personalized AI tips.'] };
  }

  // Build a brief summary of what's filled in
  const context = [];
  if (resumeData.fullName) context.push(`Name: ${resumeData.fullName}`);
  if (resumeData.summary) context.push(`Summary: ${resumeData.summary.slice(0, 150)}`);
  if (resumeData.skills?.length) context.push(`Skills: ${resumeData.skills.slice(0, 8).join(', ')}`);
  if (resumeData.experience?.length) {
    const exp = resumeData.experience[0];
    if (exp?.role) context.push(`Latest role: ${exp.role} at ${exp.company}`);
  }

  const prompt = `You are a senior career coach reviewing a resume being built step-by-step.
Current step: "${step}" — covers ${STEP_GUIDES[step]}.
${context.length ? `Resume context so far:\n${context.join('\n')}` : 'No data filled in yet.'}

Give exactly 3 short, actionable, specific tips for the "${step}" section.
Focus on ATS optimization, impact language, and what recruiters look for.
Return ONLY a JSON array of 3 strings, no markdown. Example: ["Tip 1", "Tip 2", "Tip 3"]`;

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: GPT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You return ONLY a JSON object with a "tips" key containing an array of 3 strings.',
        },
        { role: 'user', content: prompt + '\n\nReturn: {"tips": ["tip1","tip2","tip3"]}' },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const raw = response.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw || '{}');
    const tips = Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [];

    if (tips.length === 0) throw new Error('Empty tips array');
    return { tips, step };
  } catch (err) {
    logger.warn(`[BuilderTips] AI failed: ${err.message}`);
    // Graceful fallback tips per step
    const fallbacks = {
      basics: [
        'Use a professional email (firstname.lastname@domain.com).',
        'Add your LinkedIn URL and GitHub if applying to tech roles.',
        'Include your city/region but skip your full address for privacy.',
      ],
      summary: [
        'Keep your summary to 2-3 sentences and lead with your strongest skills.',
        'Mention years of experience and your most impressive achievement.',
        'Tailor your summary to each job you apply to.',
      ],
      education: [
        'List your highest degree first (reverse chronological).',
        'Include GPA only if it is 3.5+ or specifically requested.',
        'Add relevant coursework or honors if you have limited work experience.',
      ],
      experience: [
        'Start each bullet with a strong action verb (Led, Built, Improved, Reduced).',
        'Quantify impact whenever possible — use numbers, percentages, and time frames.',
        'Focus on achievements, not just responsibilities.',
      ],
      projects: [
        'Link to GitHub or live demos to let recruiters verify your work.',
        'Mention the problem you solved, not just the tech stack used.',
        'Highlight team size and your specific contribution.',
      ],
      skills: [
        'Mirror the exact skill names used in the job description for ATS.',
        'Group skills by category: Languages, Frameworks, Tools, Soft Skills.',
        'Remove outdated or irrelevant technologies.',
      ],
      custom: [
        'Certifications with expiry dates — include the year earned.',
        'Publications — use standard citation format.',
        'Volunteer work can substitute for experience gaps.',
      ],
    };
    return { tips: fallbacks[step] || ['Fill in all fields to get AI tips.'], step };
  }
}

module.exports = { generateBuilderTips };
