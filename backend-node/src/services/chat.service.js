// src/services/chat.service.js — Vita AI Career Copilot (OpenAI powered)
const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const chatPreprocessor = require('./chatPreprocessor');

const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// ─── Cost Cutting: Query Cache ────────────────────────────────────────────────
const CHAT_CACHE = new Map();
const CACHE_LIMIT = 200;

function getCachedReply(message, mode, userName) {
  const key = `${userName || 'anon'}:${mode}:${message.trim().toLowerCase()}`;
  return CHAT_CACHE.get(key);
}

function setCachedReply(message, mode, userName, replyData) {
  const key = `${userName || 'anon'}:${mode}:${message.trim().toLowerCase()}`;
  if (CHAT_CACHE.size >= CACHE_LIMIT) {
    const oldestKey = CHAT_CACHE.keys().next().value;
    CHAT_CACHE.delete(oldestKey);
  }
  CHAT_CACHE.set(key, replyData);
}


// ─── Cost Cutting: Dynamic Context Filter ─────────────────────────────────────
function requiresResumeContext(message, mode) {
  if (['jd-tailor', 'mock-interview', 'auto-fix'].includes(mode)) {
    return true;
  }
  const keywords = [
    'resume', 'cv', 'profile', 'experience', 'skills', 'education', 
    'project', 'history', 'weakness', 'strength', 'gap', 'improve', 
    'analyze', 'ats', 'score', 'my cv', 'my resume', 'feedback'
  ];
  const query = message.toLowerCase();
  return keywords.some(k => query.includes(k));
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

// ─── Core OpenAI Call ─────────────────────────────────────────────────────────
async function callGPT(systemPrompt, userPrompt, json = false, maxTokens = 250) {
  const client = getClient();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const requestOptions = {
    model: GPT_MODEL,
    temperature: json ? 0.3 : 0.75,
    max_tokens: maxTokens,
    messages,
  };

  if (json) {
    requestOptions.response_format = { type: 'json_object' };
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.completions.create(requestOptions);
      const text = response.choices?.[0]?.message?.content;
      if (!text || text.trim() === '') throw new Error('GPT returned empty response.');
      logger.info(`[Vita Genixpay] Got response (${text.length} chars)`);
      return text;
    } catch (err) {
      lastError = err;
      const isRetryable = !err.status || err.status >= 500 || err.status === 429;
      if (!isRetryable || attempt >= 3) break;
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  throw new Error(lastError?.message || 'AI is temporarily unavailable.');
}

// ─── System Prompt Builder (Spec Section 6) ──────────────────────────────────
function buildSystemPrompt(userContext, injectResume = false) {
  const { userName, resumeText, resumeTitle, atsScore, targetRole, skills } = userContext || {};

  const resumeSection = (injectResume && resumeText)
    ? `\n\n--- USER'S RESUME ---\n${resumeText.slice(0, 3000)}\n--- END RESUME ---`
    : '';

  const metaLines = [
    userName && `User Name: ${userName}`,
    resumeTitle && `Resume Title: ${resumeTitle}`,
    targetRole && `Target Role: ${targetRole}`,
    skills && `Key Skills: ${skills}`,
    atsScore != null && `Current ATS Score: ${atsScore}/100`,
  ].filter(Boolean);

  const userProfileSection = metaLines.length
    ? `\n\nUser Profile:\n${metaLines.join('\n')}${resumeSection}`
    : '';

  return `You are the assistant for Vita AI Genixpay, a resume and career platform. You help logged-in users understand and navigate the platform's features. You are cost-conscious: keep answers concise (2-4 sentences max unless the user asks for detail).

The platform has these features/pages:
1. Upload Resume — analyzes an uploaded resume and returns ATS score, strengths, weaknesses, improvement suggestions, best-fit job roles, and recommended projects.
2. Resume Builder — build a resume from 10+ ATS-friendly templates; build fully with AI assistance; import an existing resume and improve it with AI; use "AI Draft" to generate a highly ATS-friendly resume by answering a few questions; preview with different templates, fonts, sizes, and colors; download as PDF or email it directly.
3. Interview — mock interviews based on the user's resume or manual input (name, skills, description) with difficulty levels (easy/medium/hard); Target Interview mode tailored to a specific job role, skills, and job description.
4. Cover Letter — generates a cover letter for a specific job role, company, and description, in different tones.
5. Job Matcher — scores how well a resume matches a specific job/job description and shows where to improve.
6. Pricing — shows plans and exact prices with included features.
7. Dashboard — shows the user's activity history and offers quick actions.
8. Privacy Policy and Terms — informational pages.
9. History — for resume and interview history.
10. Profile — for changing password, name, bio, headline.${userProfileSection}

Rules you must always follow:
- If the user's question relates to any feature above, briefly explain how that feature helps and recommend they go to that page. Always offer to navigate them there directly (respond with a clear call-to-action, e.g., "Want me to take you to Resume Builder?").
- Never suggest external/third-party tools for something the platform already does — always recommend the platform's own relevant feature first.
- For pricing questions, describe the plan tiers briefly and suggest they check the Pricing page for exact current prices.
- For privacy policy/terms questions, summarize briefly and accurately — do not invent policy details.
- Keep responses short, friendly, and action-oriented. Avoid long paragraphs.
- If a request is fully outside the platform's scope (e.g., unrelated general knowledge), answer briefly and, if there's any natural tie-in to a platform feature, mention it — otherwise just answer helpfully without forcing a pitch.
- Do not repeat a page recommendation if you already suggested it earlier in this same conversation and the user didn't act on it — ask instead if they'd like a different kind of help.
- For resume section improvements, end with an action block:
  \`\`\`action
  {"type": "apply-to-resume", "section": "summary", "content": "The improved text here"}
  \`\`\`
- For copy-able outreach content, end with:
  \`\`\`action
  {"type": "copy-text", "label": "Copy LinkedIn DM", "content": "The message here"}
  \`\`\``;
}

// ─── Feature: Core Chat ───────────────────────────────────────────────────────
async function handleCoreChat(message, conversationHistory, userContext) {
  const injectResume = requiresResumeContext(message, 'chat');
  const systemPrompt = buildSystemPrompt(userContext, injectResume);

  const historyText = (conversationHistory || [])
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'User' : 'Vita AI Genixpay'}: ${m.content}`)
    .join('\n');

  const userPrompt = historyText
    ? `Previous conversation:\n${historyText}\n\nUser's latest message: ${message}`
    : message;

  const response = await callGPT(systemPrompt, userPrompt, false);
  return { reply: response.trim(), mode: 'chat' };
}

// ─── Feature: JD Tailor ───────────────────────────────────────────────────────
async function handleJdTailor(jobDescription, userContext) {
  const { resumeText } = userContext || {};

  if (!resumeText) {
    return {
      reply: "I don't have your resume loaded yet. Please go to **Resume Analyzer** or **Resume Builder** first, then come back to tailor for this job!",
      mode: 'jd-tailor',
    };
  }

  const systemPrompt = `You are an expert ATS resume optimizer. Analyze the match between a resume and job description.
Be precise, specific, and actionable. Respond in clear markdown.`;

  const userPrompt = `Compare this resume against the job description and provide:
1. A match score (0-100)
2. Top 5 missing keywords from the JD
3. Top 3 keywords already matching
4. An improved Professional Summary (3-4 sentences) with missing keywords woven in naturally

Resume:
${resumeText.slice(0, 3000)}

Job Description:
${jobDescription.slice(0, 2000)}

Format your response EXACTLY like this:
MATCH_SCORE: [number]
MISSING_KEYWORDS: [comma-separated]
MATCHING_KEYWORDS: [comma-separated]
IMPROVED_SUMMARY: [the new summary paragraph]`;

  const raw = await callGPT(systemPrompt, userPrompt, false, 600);

  const matchScore = parseInt((raw.match(/MATCH_SCORE:\s*(\d+)/) || [])[1] || '0', 10);
  const missing = (raw.match(/MISSING_KEYWORDS:\s*(.+)/) || [])[1]?.trim() || '';
  const matching = (raw.match(/MATCHING_KEYWORDS:\s*(.+)/) || [])[1]?.trim() || '';
  const summaryMatch = raw.match(/IMPROVED_SUMMARY:\s*([\s\S]+)/);
  const improvedSummary = summaryMatch ? summaryMatch[1].trim() : '';

  const replyText = `## 🎯 Job Match Analysis

**Match Score: ${matchScore}/100**

✅ **Already Matching:** ${matching}

⚠️ **Missing Keywords to Add:**
${missing.split(',').map((k) => `• ${k.trim()}`).join('\n')}

**Tailored Professional Summary:**
> ${improvedSummary}

Click **"Apply to Resume"** below to update your summary instantly!`;

  return {
    reply: replyText,
    mode: 'jd-tailor',
    matchScore,
    action: improvedSummary
      ? { type: 'apply-to-resume', section: 'summary', content: improvedSummary }
      : null,
  };
}

// ─── Feature: Mock Interview ──────────────────────────────────────────────────
async function handleMockInterview(action, payload, userContext) {
  const { resumeText, targetRole, skills, userName } = userContext || {};

  if (action === 'start') {
    const systemPrompt = `You are an experienced HR interviewer. Generate exactly 5 tailored interview questions as a JSON array.
Each object must have "q" (question) and "type" (category like HR/Technical/Behavioral/Sales etc.).
Respond ONLY with a valid JSON array, no other text.`;

    const userPrompt = `Candidate: ${userName || 'the user'}
Target Role: ${targetRole || 'Not specified'}
Skills: ${skills || 'Not specified'}
Resume (partial): ${resumeText ? resumeText.slice(0, 1500) : 'Not provided'}

Generate 5 tailored interview questions.`;

    const raw = await callGPT(systemPrompt, userPrompt, true, 600);
    let questions = [];
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    } catch {
      questions = [{ q: 'Tell me about yourself.', type: 'HR' }];
    }

    return {
      reply: `## 🎙️ Mock Interview Started!\n\nI'll ask you **5 questions** based on your profile. Answer naturally!\n\n**Question 1:** ${questions[0]?.q || 'Tell me about yourself.'}`,
      mode: 'mock-interview',
      interviewState: { questions, currentIndex: 0, answers: [] },
    };
  }

  if (action === 'evaluate') {
    const { question, answer, questionType } = payload;

    const systemPrompt = `You are a senior ${questionType || 'HR'} interviewer evaluating a candidate's answer. Be honest but encouraging.`;

    const userPrompt = `Question: ${question}
Candidate's Answer: ${answer}
Role applied for: ${targetRole || 'Not specified'}

Evaluate and respond in this EXACT format:
SCORE: [x/10]
STRENGTHS: [what they did well in one line]
IMPROVEMENTS: [what was missing in one line]
STAR_TIP: [one-line STAR method improvement tip]
MODEL_ANSWER: [a strong model answer in 3-4 sentences]`;

    const raw = await callGPT(systemPrompt, userPrompt, false, 400);

    const score = (raw.match(/SCORE:\s*(\d+(?:\.\d+)?)\/10/) || [])[1] || '?';
    const strengths = (raw.match(/STRENGTHS:\s*(.+)/) || [])[1]?.trim() || '';
    const improvements = (raw.match(/IMPROVEMENTS:\s*(.+)/) || [])[1]?.trim() || '';
    const starTip = (raw.match(/STAR_TIP:\s*(.+)/) || [])[1]?.trim() || '';
    const modelMatch = raw.match(/MODEL_ANSWER:\s*([\s\S]+)/);
    const modelAnswer = modelMatch ? modelMatch[1].trim() : '';

    return {
      reply: `## 📊 Answer Score: ${score}/10\n\n✅ **Strengths:** ${strengths}\n\n⚠️ **Improve:** ${improvements}\n\n💡 **STAR Tip:** ${starTip}\n\n**Model Answer:**\n> ${modelAnswer}`,
      mode: 'mock-interview',
      evaluation: { score, strengths, improvements, modelAnswer },
    };
  }

  return { reply: "Type **'start interview'** to begin your mock interview!", mode: 'chat' };
}

// ─── Feature: Cold Outreach ───────────────────────────────────────────────────
async function handleOutreach(outreachType, targetDetails, userContext) {
  const { resumeText, userName, skills, targetRole } = userContext || {};

  const typeMap = {
    linkedin: 'LinkedIn Connection Request message (max 300 chars)',
    email: 'Cold Email to a recruiter (Subject line + email body, professional tone)',
    pitch: '30-second Elevator Pitch script (speak naturally, under 80 words)',
  };

  const systemPrompt = `You are a professional career coach and expert writer. Write compelling outreach content.
Write ONLY the message itself — no intro, no explanation, just the content.`;

  const userPrompt = `Write a ${typeMap[outreachType] || 'professional outreach message'}.

About the candidate:
- Name: ${userName || 'The candidate'}
- Target Role: ${targetRole || (targetDetails?.targetRole || 'Software Developer')}
- Key Skills: ${skills || 'Not specified'}
- Background: ${resumeText ? resumeText.slice(0, 600) : 'Not provided'}

Target: ${targetDetails?.company || 'a top company'} / ${targetDetails?.recruiter || 'the hiring manager'}`;

  const message = await callGPT(systemPrompt, userPrompt, false, 400);

  const labels = {
    linkedin: '📋 Copy LinkedIn Message',
    email: '📧 Copy Cold Email',
    pitch: '🎙️ Copy Elevator Pitch',
  };

  return {
    reply: `## ${labels[outreachType] || '📝 Your Message'}\n\n${message.trim()}`,
    mode: 'outreach',
    action: {
      type: 'copy-text',
      label: labels[outreachType] || 'Copy Message',
      content: message.trim(),
    },
  };
}

// ─── Feature: Salary Insights ─────────────────────────────────────────────────
async function handleSalaryInsights(query, userContext) {
  const { targetRole, skills } = userContext || {};

  const systemPrompt = `You are a compensation expert with up-to-date knowledge of Indian tech job market salary ranges.
Provide specific salary data in ₹ LPA format, top companies, and negotiation advice.`;

  const userPrompt = `${query}

User's context:
- Target Role: ${targetRole || 'Not specified'}
- Skills: ${skills || 'Not specified'}

Provide:
1. Salary range for this role in India (Fresher / 2-3 yrs / 5+ yrs experience)
2. Top 3 companies offering best pay in this domain
3. A 3-line salary negotiation script for an HR call`;

  const response = await callGPT(systemPrompt, userPrompt, false, 400);
  return { reply: `## 💰 Salary Insights\n\n${response.trim()}`, mode: 'salary' };
}

// ─── Feature: Auto-Fix Section ────────────────────────────────────────────────
async function handleAutoFix(section, currentContent, instruction, userContext) {
  const { targetRole, skills } = userContext || {};

  const systemPrompt = `You are an expert resume writer specializing in ATS-optimized, impactful resume content.
Return ONLY the improved content — no explanation, no intro text.`;

  const userPrompt = `Improve this resume section:

Section: ${section}
Current Content: ${currentContent || 'Not provided'}
Target Role: ${targetRole || 'Not specified'}
Skills: ${skills || 'Not specified'}
Instruction: ${instruction || 'Make it more impactful and ATS-optimized'}

Rules:
- Keep the same format (bullets if original uses bullets, paragraph if paragraph)
- Use strong action verbs and quantifiable metrics where possible
- Keep it concise and ATS-friendly`;

  const improved = await callGPT(systemPrompt, userPrompt, false, 500);

  return {
    reply: `## ✨ Improved ${section}\n\n${improved.trim()}\n\nClick **"Apply to Resume"** to update this section instantly!`,
    mode: 'auto-fix',
    action: {
      type: 'apply-to-resume',
      section: section.toLowerCase().replace(/\s+/g, '-'),
      content: improved.trim(),
    },
  };
}

// ─── Main Dispatcher ──────────────────────────────────────────────────────────
async function processMessage(payload) {
  const { message, mode, conversationHistory, userContext, modePayload, isAuthenticated } = payload;
  logger.info(`[Vita Genixpay] mode=${mode || 'chat'}, msgLen=${message?.length || 0}, auth=${!!isAuthenticated}`);

  // 1. Preprocessor Pipeline (Spam, Local Rules, FAQ/Intent, Navigation, Logged-out guard)
  const prepResult = await chatPreprocessor.processMessage({ message, mode, userContext, isAuthenticated });
  if (!prepResult.openaiCalled) {
    logger.info(`[Vita Genixpay] Resolved locally without OpenAI. Classification: ${prepResult.classification}`);
    return {
      reply: prepResult.reply,
      action: prepResult.action || null,
      mode: prepResult.mode,
      classification: prepResult.classification,
      matchedFaq: prepResult.matchedFaq,
      openaiCalled: false,
      tokensSaved: prepResult.tokensSaved
    };
  }

  // 2. Query Cache Check
  const cached = getCachedReply(message, mode || 'chat', userContext?.userName);
  if (cached) {
    logger.info(`[Vita Genixpay] Cache HIT for query: "${message.slice(0, 30)}"`);
    return {
      ...cached,
      classification: prepResult.classification,
      matchedFaq: null,
      openaiCalled: false,
      tokensSaved: 1450 // Approximate input + output tokens saved from cached request
    };
  }

  let responseData;
  switch (mode) {
    case 'jd-tailor':
      responseData = await handleJdTailor(message, userContext);
      break;

    case 'mock-interview':
      responseData = await handleMockInterview(
        modePayload?.action || 'start',
        { question: message, ...modePayload },
        userContext
      );
      break;

    case 'outreach':
      responseData = await handleOutreach(modePayload?.outreachType || 'linkedin', modePayload || {}, userContext);
      break;

    case 'salary':
      // salary mode uses longer output, keep at 400 tokens
      responseData = await handleSalaryInsights(message, userContext);
      break;

    case 'auto-fix':
      responseData = await handleAutoFix(
        modePayload?.section || 'Professional Summary',
        modePayload?.currentContent || '',
        message,
        userContext
      );
      break;

    default:
      responseData = await handleCoreChat(message, conversationHistory || [], userContext);
      break;
  }

  // 3. Save to Cache
  if (responseData && !responseData.reply.includes('❌') && mode !== 'mock-interview') {
    setCachedReply(message, mode || 'chat', userContext?.userName, responseData);
  }

  return {
    ...responseData,
    reply: prepResult.serviceRecommendation
      ? `${responseData.reply}${prepResult.serviceRecommendation}`
      : responseData.reply,
    classification: prepResult.classification,
    matchedFaq: null,
    openaiCalled: true,
    tokensSaved: 0
  };
}

module.exports = { processMessage };
