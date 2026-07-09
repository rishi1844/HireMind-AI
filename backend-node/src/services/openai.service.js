// src/services/openai.service.js — OpenAI GPT-4o integration
// 100% AI-driven — no static fallbacks
const { OpenAI } = require('openai');
const crypto = require('crypto');
const logger = require('../utils/logger');
const prisma = require('../config/db');

// ─── Analysis result cache (keyed by SHA-256 of resume text) ─────────────────
// Guarantees identical output on every re-analysis of the same resume content.
// Max 300 entries; oldest evicted when full.
const ANALYSIS_CACHE = new Map();
const ANALYSIS_CACHE_MAX = 300;
// Bump this whenever the analysis prompt changes significantly
// to auto-invalidate all old cached results on next server restart.
const CACHE_VERSION = 'v5'; // v5 = natural annotation count, no fixed min/max

function hashResume(text) {
  // Include CACHE_VERSION in the hash key — changing version auto-busts cache
  return crypto.createHash('sha256').update(CACHE_VERSION + ':' + text.trim()).digest('hex');
}

function cacheGet(key) {
  return ANALYSIS_CACHE.get(key) ?? null;
}

function cacheSet(key, value) {
  if (ANALYSIS_CACHE.size >= ANALYSIS_CACHE_MAX) {
    // Evict oldest entry
    ANALYSIS_CACHE.delete(ANALYSIS_CACHE.keys().next().value);
  }
  ANALYSIS_CACHE.set(key, value);
}

const MAX_RETRIES = parseInt(process.env.OPENAI_MAX_RETRIES || process.env.GEMINI_MAX_RETRIES || '3', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.OPENAI_INITIAL_BACKOFF_MS || process.env.GEMINI_INITIAL_BACKOFF_MS || '1200', 10);
const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set in .env');
  return new OpenAI({ apiKey });
}

// ─── Robust JSON extractor ────────────────────────────────────────────────────
function extractJson(text) {
  let clean = (text || '').trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    clean = clean.slice(start, end + 1);
  }
  return clean;
}

// ─── Track token usage to DB (fire-and-forget, never throws) ──────────────────
async function trackTokens(userId, feature, usage) {
  try {
    if (!usage) return;
    await prisma.tokenUsage.create({
      data: {
        userId: userId ? BigInt(userId) : null,
        model: 'gpt',
        feature,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    });
  } catch (err) {
    logger.warn(`[Token] Failed to record usage: ${err.message}`);
  }
}

// ─── Core call with retry + token tracking ────────────────────────────────────
// temperature defaults: 0 for structured JSON (deterministic), 0.7 for free text
async function callGPT(prompt, jsonMode = true, feature = 'general', userId = null, temperature = null) {
  const client = getClient();
  const totalAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const messages = [
        {
          role: 'system',
          content: jsonMode
            ? 'You are an expert AI assistant. You must respond with ONLY valid JSON. No markdown, no explanation, no extra text — pure JSON only.'
            : 'You are an expert AI assistant. Respond in plain text only.',
        },
        { role: 'user', content: prompt },
      ];

      const resolvedTemp = temperature !== null ? temperature : (jsonMode ? 0 : 0.7);
      const requestOptions = {
        model: GPT_MODEL,
        temperature: resolvedTemp,
        // seed gives extra determinism on models that support it (gpt-4o, gpt-4-turbo)
        seed: jsonMode ? 42 : undefined,
        max_tokens: 4096,
        messages,
      };

      if (jsonMode) {
        requestOptions.response_format = { type: 'json_object' };
      }

      const response = await client.chat.completions.create(requestOptions);
      const text = response.choices?.[0]?.message?.content;
      if (!text || text.trim() === '') throw new Error('GPT returned an empty response.');
      logger.info(`[GPT] Got response (${text.length} chars) | feature=${feature} | tokens=${response.usage?.total_tokens || '?'}`);

      // Track token usage asynchronously
      trackTokens(userId, feature, response.usage);

      return text;
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt >= totalAttempts) break;
      const delay = calculateBackoffDelay(attempt);
      logger.warn(`GPT attempt ${attempt}/${totalAttempts} failed: ${err.message}. Retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }

  throw new Error(lastError?.message || 'GPT is temporarily unavailable. Please try again.');
}

function isRetryableError(err) {
  if (!err.status) return true;
  return err.status === 429 || err.status >= 500;
}

function calculateBackoffDelay(attempt) {
  const exp = INITIAL_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 400) + 200;
  return Math.min(exp + jitter, 6000);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }


// ─── OCR fallback: extract text from image-based PDF using OpenAI Files API ────
// GPT-4o Vision does NOT accept PDFs as image_url data URIs (only PNG/JPEG/WebP).
// Correct approach: upload the PDF via Files API, then reference file_id in chat.
async function extractTextFromImagePdf(pdfBuffer, userId = null) {
  const client = getClient();
  let uploadedFileId = null;

  logger.info('[OCR] Uploading image-based PDF to OpenAI Files API for text extraction…');

  try {
    const { toFile } = require('openai');
    const fileObj = await toFile(pdfBuffer, 'resume.pdf', { type: 'application/pdf' });

    const uploadedFile = await client.files.create({
      file: fileObj,
      purpose: 'user_data',
    });
    uploadedFileId = uploadedFile.id;
    logger.info(`[OCR] PDF uploaded to Files API: ${uploadedFileId}`);

    const response = await client.chat.completions.create({
      model: GPT_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Tu ek OCR expert hai jo scanned resume PDFs se text extract karta hai.

Tujhe ek scanned resume ki images di gayi hain (ek ya zyada pages).

KAAM:
Har page ka poora text extract kar — exactly jaisa resume mein likha hai.

RULES:
1. Har cheez extract kar — name, contact info, summary, experience, 
   skills, education, certifications, projects — sab kuch
2. Structure preserve kar — sections, bullet points, headings jaise hain waise rakho
3. Bullet points ke liye "•" ya "-" use karo
4. Jo exactly likha hai wahi likho — apni taraf se kuch mat jodo, 
   kuch mat hatao, kuch mat summarize karo
5. Koi commentary mat likho — "Here is the text:" jaisa kuch nahi
6. Koi label mat lagao — "Name:", "Section:" jaisa kuch nahi
7. Agar koi word clearly visible nahi hai toh [unclear] likho
8. Multiple pages hain toh sab ek saath extract karo — 
   page numbers mat likho, bas content likho

Seedha resume ka plain text output do, kuch aur nahi.`,
            },
            {
              type: 'file',
              file: { file_id: uploadedFileId },
            },
          ],
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    logger.info(`[OCR] GPT-4o extracted ${text.length} chars from image PDF via Files API.`);
    trackTokens(userId, 'ocr', response.usage);
    return text;

  } catch (err) {
    logger.error(`[OCR] Files API OCR failed: ${err.message}`);
    return '';
  } finally {
    if (uploadedFileId) {
      client.files.delete(uploadedFileId).catch((e) =>
        logger.warn(`[OCR] Could not delete temp file ${uploadedFileId}: ${e.message}`)
      );
    }
  }
}

// ─── Validate: Is this document actually a resume? ────────────────────────────
// Returns { isResume: true/false, reason: string }
async function validateIsResume(text, userId = null) {
  const prompt = `You are a strict document classifier. Your job is to determine if the given text is a professional resume/CV.

A professional resume MUST contain at least MOST of: personal contact info, work experience, education, skills section.
Reject the following as NOT a resume:
- Cover letters (these are addressed to a hiring manager and explain motivation for a role)
- Pay slips / salary slips (these contain salary, deductions, net pay)
- Invoices, receipts, certificates
- Blank or near-blank documents
- Random text or notes
- Purely academic transcripts with no work experience

Document text (first 1500 chars):
${text.slice(0, 1500)}

Respond ONLY with this exact JSON:
{
  "isResume": true or false,
  "reason": "one sentence explaining your decision"
}`;

  try {
    const raw = await callGPT(prompt, true, 'validate', userId);
    const parsed = JSON.parse(extractJson(raw));
    return {
      isResume: parsed.isResume === true,
      reason: parsed.reason || 'Not a resume.',
    };
  } catch (err) {
    logger.warn('[Validate] GPT validation failed, defaulting to accept: ' + err.message);
    // If validation itself fails, let it through (don't block user)
    return { isResume: true, reason: 'Validation check skipped.' };
  }
}

// ─── Analyze Resume (Extended — Resume Worded style) ─────────────────────────
// REPLACE the existing analyzeResume function in openai.service.js with this one.
// Everything else in openai.service.js stays the same.

async function analyzeResume(resumeText, userId = null, force = false) {
  if (!resumeText || resumeText.trim().length < 100) {
    const err = new Error('Resume text is too short or empty.');
    err.status = 400;
    throw err;
  }

  // ── Cache check: same resume text → same result, always ──────────────────
  const cacheKey = hashResume(resumeText);
  if (!force) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      logger.info(`[Analyze] Cache HIT for resume hash ${cacheKey.slice(0, 12)}… — returning stored result, no API call.`);
      return cached;
    }
  } else {
    logger.info(`[Analyze] Force flag set — bypassing in-memory cache for hash ${cacheKey.slice(0, 12)}…`);
    ANALYSIS_CACHE.delete(cacheKey);
  }

  const prompt = `You are a strict senior recruiter and ATS expert. 
Score this resume HONESTLY. Do NOT be generous. Do NOT pad scores.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — DETECT DOMAIN FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before scoring, classify the resume into ONE domain:
- "tech" → software, data, IT, engineering, product
- "non_tech" → sales, marketing, finance, HR, operations, design, healthcare, legal

This affects the entire scoring rubric below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SCORE USING DOMAIN-AWARE RUBRIC (100 pts base)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SECTION 1] CONTACT INFO — 5 pts
  Name:1 | Email:1 | Phone:1 | LinkedIn/Portfolio:1 | City:1

[SECTION 2] PROFESSIONAL SUMMARY — 8 pts
  Present & role-specific: 3
  Keyword-rich & targeted to a job type: 3
  Compelling, not generic ("hardworking professional"): 2
  ⚠ IF SUMMARY IS COMPLETELY ABSENT: deduct 2 extra points from total.
  Reason: missing summary = untailored resume = ATS disadvantage.

[SECTION 3] WORK EXPERIENCE — 25 pts
  Relevant experience present: 8
  Clear title + company + dates per role: 5
  Quantified achievements (numbers, %, revenue, scale): 7
  Strong action verbs (not: managed, worked, helped, assisted): 5
  ⚠ PENALTY RULES for Experience:
    - Each bullet using a REPEATED weak verb (developed/designed/worked/managed 
      used 3+ times): -0.5 pts per repeat (max -2)
    - Bullets that are 1 line with no outcome or result: -0.5 each (max -2)
    - Passive voice bullets ("was responsible for"): -0.5 each (max -1)

[SECTION 4] SKILLS — 20 pts
  IF domain = "tech":
    Hard technical skills (languages, frameworks, tools): 12
    Industry/role match (skills relevant to target role): 8
    [Soft skills get 0 weight — irrelevant for ATS]
  IF domain = "non_tech":
    Domain tools (CRM, Excel, Salesforce, Figma, etc.): 8
    Transferable hard skills (data analysis, budgeting, etc.): 6
    Industry-specific competencies: 6

[SECTION 5] EDUCATION — 10 pts
  Degree name: 3
  Institution name: 3
  Graduation year: 2
  CGPA or grade (if ≤3 years experience, this matters more): 2

[SECTION 6] CERTIFICATIONS & PLATFORM SIGNALS — 8 pts
  IF domain = "tech":
    Recognized certifications (AWS/GCP/Azure/Meta/Google cert, etc.): 3
    Coding platform presence (LeetCode/GitHub/HackerRank/Kaggle): 3
    Open source contributions or live project links: 2
  IF domain = "non_tech":
    Recognized certifications (Google Analytics, HubSpot, CFA, PMP, etc.): 3
    Portfolio or work samples link (Behance, case studies, reports): 3
    Volunteer work, extracurriculars showing domain relevance: 2
  ⚠ If this section is completely absent: award 0, no extra penalty.

[SECTION 7] KEYWORDS & ATS — 18 pts
  Industry keywords present throughout resume: 8
  No tables/columns/graphics breaking parser: 5
  Standard section headings used: 3
  File/format signals clean: 2

[SECTION 8] FORMATTING — 6 pts
  Logical section order: 2
  Consistent date/font/spacing formatting: 2
  Appropriate length (1 page for <3yrs, max 2 pages otherwise): 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — APPLY GLOBAL PENALTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P1. REPEATED WORDS PENALTY:
  Count unique weak/overused verbs appearing 3+ times across all bullets.
  Deduct: 1 point per unique repeated word. Max deduction: -5 pts.

P2. VAGUE CONTENT PENALTY:
  If MORE than 40% of experience bullets have NO measurable outcome:
  Deduct: -3 pts flat.

P3. FILLER PHRASES PENALTY:
  "team player", "hardworking", "passionate about", "go-getter",
  "results-driven", "detail-oriented", "think outside the box":
  Deduct: -0.5 pts each. Max: -2 pts.

P4. MISSING CRITICAL SECTIONS:
  If Work Experience completely absent AND candidate has 2+ years implied: -5 pts
  If Skills section completely absent: -3 pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — EXPERIENCE LEVEL CALIBRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "fresher": 0–1 years or student
- "junior": 1–3 years  
- "mid": 3–7 years
- "senior": 7+ years

Score floor rules:
- Fresher with good education+projects: realistic max = 72
- Junior with decent experience: realistic max = 82
- Mid/Senior with weak bullets: do NOT floor above 55

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORING BENCHMARKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20–35: Severely incomplete
36–50: Fresher/weak — major gaps
51–65: Average — needs improvement  
66–78: Good — minor improvements needed
79–90: Strong — well-optimized
91–100: Exceptional (rare)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARRAY SIZE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- strengths: 3–7 items. Natural count — do NOT always give exactly 3.
- weaknesses: 3–7 items. Natural count.
- improvements: 3–7 items. Natural count.
- jobRoles: 2–6 items.
- projectSuggestions: 2–5 items.
- quickPractice: EXACTLY 4 tailored Q&A pairs.

Every item must be specific, reference actual resume content, minimum 12 words.
No vague 3-word summaries. No generic templates.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE ANNOTATIONS — CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR JOB: Read every single bullet point, sentence, and phrase that has
actual written content in the resume. For each one with a genuine quality
problem, create one annotation. Let the count emerge naturally.

WHAT TO SCAN AND FLAG:
✓ Experience bullet points — weak verbs, no metrics, vague outcome, passive voice
✓ Project descriptions — vague explanation, no result mentioned, no tech stack
✓ Summary paragraph — generic filler, no role targeting, clichés
✓ Skills section — only if it contains soft skill filler like "good communication",
  "team player", "positive attitude" — flag those specific phrases only
✓ Education — only if there is a written description/achievement line that is vague

ABSOLUTE NO-FLAG LIST — NEVER create an annotation for these:
✗ Contact info of ANY kind: name, email, phone, city, LinkedIn URL, GitHub URL,
  portfolio URL, any icon or symbol used for contact details — NEVER flag these
✗ Missing sections (summary absent, no certifications) — no text = no underline
✗ Section headings (EXPERIENCE, EDUCATION, SKILLS, PROJECTS etc.)
✗ Job titles, company names, dates, locations
✗ Degree name, university name, graduation year, CGPA number
✗ Coding platform profiles (LeetCode, GeeksforGeeks, HackerRank, GitHub)
✗ Certification names and issuer names
✗ Language proficiency lines (English — Native, Hindi — Bilingual)
✗ Personal details (nationality, marital status, father's name)
✗ Hobbies, interests section

SEVERITY:
"high"   → bullet has zero outcome AND no strong verb
           OR passive voice used ("was responsible for", "helped in", "assisted with")
           OR project description is one vague line with no result or tech
"medium" → weak/overused verb (developed, worked, handled, managed, ensured,
           supported, assisted) but some context exists
           OR vague phrase that could easily be made specific with numbers
           OR project missing either tech stack OR result (not both)
"low"    → minor phrasing issue, slightly generic, small keyword gap

COUNT: Let it emerge from resume quality. Do NOT target 2 or 3.
- Well-written resume: 2–4 annotations
- Average resume: 5–8 annotations
- Weak/vague resume: 9–14 annotations
One annotation per problematic line. Never group two issues together.

lineHint RULES — THIS IS CRITICAL FOR UNDERLINE FEATURE:
- Copy EXACTLY 6–12 consecutive words verbatim from the resume
- Must come from body content only (bullets, descriptions, summary text)
- NEVER from: headings, job titles, company names, dates, URLs, contact info
- Must be findable by exact string search in the resume text
- Character-for-character. No paraphrasing. No summarizing.
- If you cannot find a clean verbatim phrase from actual content, SKIP the annotation

magicReplacement:
- Complete rewritten bullet/phrase
- Start with strong verb: Led, Built, Engineered, Deployed, Increased, Reduced,
  Delivered, Streamlined, Automated, Designed, Architected, Launched
- Add realistic metric if original has none (base on resume context)
- Same approximate length as original ±20%
- ATS keyword-rich for detected domain

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET ANALYSIS: Min 2, max 10. Only problematic bullets.
Problems: "weak_verb" | "no_metrics" | "vague" | "passive_voice" | "too_short" | "repeated_word" | "no_outcome"
"improved" = drop-in ATS-optimized replacement.

REPEATED WORDS: Words used 3+ times (excluding articles/prepositions). Max 8.

INDUSTRY KEYWORDS: 8–15 keywords for detected domain.
Mark each: present:true or present:false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resume Text:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${resumeText.slice(0, 8000)}

Return EXACTLY this JSON (no markdown, no extra fields):
{
  "domain": "tech" | "non_tech",
  "experienceLevel": "fresher" | "junior" | "mid" | "senior",
  "atsScore": <integer 0-100, AFTER all penalties applied>,
  "penaltiesApplied": {
    "repeatedWords": <0 to -5>,
    "vagueContent": <0 or -3>,
    "fillerPhrases": <0 to -2>,
    "missingSections": <0 to -8>,
    "summaryAbsent": <0 or -3>
  },
  "sectionScores": {
    "contactInfo": <0-5>,
    "summary": <0-8>,
    "workExperience": <0-25>,
    "skills": <0-20>,
    "education": <0-10>,
    "certifications": <0-8>,
    "keywords": <0-18>,
    "formatting": <0-6>
  },
  "categories": {
    "readability": { "score": <0-10>, "issues": ["issue1", "issue2"] },
    "impact":      { "score": <0-10>, "issues": ["issue1", "issue2"] },
    "brevity":     { "score": <0-10>, "issues": ["issue1"] },
    "style":       { "score": <0-10>, "issues": ["issue1"] }
  },
  "strengths": [...],
  "weaknesses": [...],
  "improvements": [...],
  "jobRoles": [...],
  "projectSuggestions": [...],
  "quickPractice": [
    {"question": "...", "sampleAnswer": "..."},
    {"question": "...", "sampleAnswer": "..."},
    {"question": "...", "sampleAnswer": "..."},
    {"question": "...", "sampleAnswer": "..."}
  ],
  "issueAnnotations": [
    {
      "section": "<Summary|Experience|Projects|Skills|Education|Certifications>",
      "severity": "<high|medium|low>",
      "issue": "Specific 1-sentence problem referencing actual resume content",
      "suggestion": "Specific 1-sentence actionable fix",
      "lineHint": "exact 6-12 word verbatim phrase from resume body content",
      "magicReplacement": "complete rewritten replacement starting with strong verb"
    }
  ],
  "bulletAnalysis": [
    {
      "original": "exact bullet text",
      "improved": "ATS-optimized replacement",
      "problems": ["weak_verb", "no_metrics"],
      "section": "EXPERIENCE"
    }
  ],
  "repeatedWords": ["word1", "word2"],
  "industryKeywords": [
    { "keyword": "Docker", "present": false },
    { "keyword": "REST APIs", "present": true }
  ]
}`;

  const raw = await callGPT(prompt, true, 'analyze', userId, 0);
  const result = extractJson(raw);

  cacheSet(cacheKey, result);
  logger.info(`[Analyze] Cache MISS — result stored for hash ${cacheKey.slice(0, 12)}…`);

  return result;
}


// ─── Generate Interview Questions (Difficulty-Aware) ──────────────────────────
async function generateInterviewQuestions(resumeText, resumeContext, candidateName, skills, description, count, userId = null, _aiModel = null, difficulty = 'medium', previousQuestions = []) {

  const normalizedDifficulty = (difficulty || 'medium').toLowerCase();

  const exclusionBlock = previousQuestions.length > 0
    ? `\nPREVIOUSLY ASKED QUESTIONS — DO NOT REPEAT OR REPHRASE ANY OF THESE:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  const difficultyInstructions = {
    easy: `EASY — Freshers, 0-2 years experience.
- Conceptual understanding only, no implementation
- "What is X?", "Explain the difference between X and Y", "Why do you use X?"
- Only ask about technologies/skills explicitly mentioned by the candidate
- 1-2 generic HR/intro questions allowed (tell me about yourself, strengths, goals, in 5 years where you see yourself, Why you want to work with us, what motivates you?)
- NO: coding problems, system design, architecture, algorithms,

STRICT RULES for EASY:
- Keep questions simple, conversational, and non-intimidating.
- A fresher with 0 experience must be able to answer every single question.
- Language must be simple. These should feel like casual conversation starters.`,

    medium: `MEDIUM — 2-5 years experience.
- Mix of concept depth + application + one behavioral
- "How does X work internally?", "When would you use X over Y?", "Describe a problem you solved using X"
- Can include 1 moderate coding/logic question IF the candidate has explicitly mentioned a programming language
- Can include 1 simple design question IF the candidate has system/backend experience
- Only ask about technologies/skills explicitly mentioned by the candidate
- e.g., Explain a project you built, How do you handle bugs?
- NOT too easy, NOT too hard
- Questions should require thought but not expert-level mastery
- 1-2 HR/behavioral question max,

STRICT RULES for MEDIUM:
- Keep questions moderate, conversational, and engaging.
- A candidate with 2-5 years of experience should be able to answer every single question.
- Language should be simple but professional.
- Mix of technical, behavioral, and situational questions appropriate to the candidate's domain.`,


    hard: `HARD — 5+ years, senior level.
- Deep expertise, trade-offs, real-world scale
- "Design X at scale", "How would you handle Y failure scenario?", "What are the trade-offs between X and Y approach?"
- Can include advanced coding/algorithmic questions ONLY IF candidate has explicitly listed relevant CS/programming skills
- Can include system design ONLY IF candidate has backend/architecture/infra experience
- Push on edge cases, failure modes, leadership/ownership scenarios
- 1 HR/behavioral question max,

STRICT RULES for HARD:
- Every question MUST be challenging for a senior professional.
- Push on architecture choices, scalability trade-offs, real-world production failures.
- If the candidate answers easily, the question was not hard enough.
- Do not ask generic "senior" questions — ask questions that specifically test the depth of their claimed experience.
- Keep questions conversational but demanding, appropriate for a senior-level interview.

Example hard questions:
- For a senior backend engineer with 8 years experience: "Design a rate limiter that handles 1M requests per second and can survive database outages. Discuss failure modes."
- For a senior data scientist: "How would you build a fraud detection system that reduces false positives by 20% while maintaining 95% recall?"`,
  };

  const prompt = `You are a senior interviewer. Generate interview questions tailored EXACTLY to this specific candidate.
Respond with ONLY valid JSON — no markdown, no explanation.

=== CANDIDATE PROFILE ===
Name: ${candidateName}
Skills mentioned: ${skills}
Description: ${description}
Resume summary: ${resumeContext}
Resume text: ${resumeText ? resumeText.slice(0, 2000) : 'Not provided'}
${exclusionBlock}


=== YOUR TASK ===

STEP 1 — Read the candidate profile carefully.
Extract ONLY the skills, technologies, tools, and domains they have explicitly mentioned.
Do NOT assume any skill they haven't mentioned.
Example: If they mention React and Node.js — ask about React and Node.js. Do NOT ask about Java, DSA, or AWS unless mentioned.

STEP 2 — Identify their domain (tech, sales, marketing, HR, finance, operations, etc.)
Base this purely on what they've written — do not guess or expand beyond their stated background.

STEP 3 — Apply difficulty rules:
${difficultyInstructions[normalizedDifficulty]}

STEP 4 — Generate exactly ${count} questions.

RULES:
1. Every question must map to a skill or experience the candidate has explicitly mentioned
2. Do NOT ask about anything not in their profile
3. Vary question angles — don't ask two questions that test the same thing
4. For coding/algorithmic questions: only include if the candidate has explicitly mentioned programming — and make the problem relevant to their stack (e.g. if they know Python, ask a Python-style problem, not a Java one)
5. ${previousQuestions.length > 0 ? 'Do NOT repeat, rephrase, or closely resemble any previously asked question listed above.' : 'Make questions diverse — no two should feel like variations of the same question.'}
6. Questions should feel like a real interview for THIS person, not a generic template

TYPE LABELS to use (pick the most accurate):
- For tech candidates: "TECHNICAL", "PROJECT", "HR", "SYSTEM_DESIGN" (medium/hard only), "CODING" (only if programming skill mentioned)
- For sales/BPO: "SALES", "CLIENT_HANDLING", "COMMUNICATION", "HR"
- For marketing: "STRATEGY", "ANALYTICS", "HR"
- For HR professionals: "RECRUITMENT", "HR_PROCESS", "PEOPLE_MANAGEMENT", "HR"
- For others: use the most fitting label for their domain

Return EXACTLY:
{
  "detectedDomain": "<their actual domain>",
  "difficulty": "${normalizedDifficulty}",
  "questions": [
    {"question": "...", "type": "..."},
    {"question": "...", "type": "..."}
  ]
}

Generate exactly ${count} questions. Stay strictly within what this candidate has mentioned.`;

  const raw = await callGPT(prompt, true, 'interview', userId);
  return extractJson(raw);
}

// ─── Evaluate Answer ──────────────────────────────────────────────────────────
async function evaluateAnswer(question, answer, resumeContext, userId = null) {
  const prompt = `You are a senior interviewer evaluating a candidate's answer. Be fair, specific, and constructive.
Respond with ONLY a valid JSON object — no other text.

Question: ${question}
Candidate Answer: ${answer}
Candidate Background: ${resumeContext}

EVALUATION RULES (STRICTLY FOLLOW):
- Evaluate ONLY the knowledge, correctness, and completeness of the answer.
- Do NOT penalize for grammatical errors, spelling mistakes, informal language, or sentence structure.
- If the answer is factually correct but poorly worded — score it HIGH.
- Only deduct marks if the answer is factually wrong, incomplete, or misses the core concept of the question.
- Minor grammar issues, typos, missing articles, broken sentence flow — IGNORE ALL OF THESE completely.
- Score range: 0.0 to 10.0 with one decimal place.
  * 8.0-10.0: Correct, detailed, shows clear understanding
  * 6.0-7.9: Mostly correct, minor gaps in depth
  * 4.0-5.9: Partially correct, missing key points
  * 2.0-3.9: Significant gaps, some understanding shown
  * 0.0-1.9: Wrong or completely off-topic

Return EXACTLY this JSON:
{
  "score": <number 0.0-10.0 with one decimal>,
  "strengths": "what the candidate got right in this specific answer — be specific",
  "weaknesses": "what was factually missing or incorrect — ignore grammar completely",
  "improvedAnswer": "a comprehensive, well-structured model answer for this specific question"
}`;

  const raw = await callGPT(prompt, true, 'interview', userId);
  return extractJson(raw);
}

// ─── Resume Summary ─────────────────────────────────────────────────────────
// NEVER mentions the person's name — uses third-person descriptors instead
async function generateResumeSummary(name, skills, experienceInput, targetRole, userId = null) {
  const client = getClient();
  const systemMsg = [
    'You are a professional resume writer.',
    'Write concise, impactful professional summaries.',
    'CRITICAL RULE: NEVER mention the person\'s name in the summary — not even once.',
    'Write in third-person without using their name.',
    'Use descriptors like "results-driven developer", "skilled engineer", "experienced analyst" instead.',
  ].join(' ');

  const userMsg = [
    'Write a professional summary for a resume. Rules:',
    '1. NEVER mention the person\'s name — not even once',
    '2. Maximum 3 lines (50-65 words total)',
    '3. Mention: current/target role, top 3-4 skills, years of experience (if provided)',
    '4. Include 1 specific achievement or strength',
    '5. End with career objective in one phrase',
    '6. Tone: confident, concise, third-person without name',
    '7. No generic filler phrases like "passionate about" or "team player"',
    '8. Output ONLY the summary text — no labels, no JSON, no markdown',
    '',
    'Candidate info:',
    'Role: ' + (targetRole || 'Not provided'),
    'Skills: ' + (skills || 'Not provided'),
    'Experience: ' + (experienceInput || 'Not provided'),
    'Target: ' + (targetRole || 'Not provided'),
    '',
    'Write the professional summary now (50-65 words, 3 lines max, name NOT mentioned):',
  ].join('\n');

  const totalAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError;
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
      });
      const text = (response.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error('GPT returned empty summary.');
      trackTokens(userId, 'builder', response.usage);
      logger.info('[Summary] Generated ' + text.length + ' chars (name-free prompt)');
      return text;
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt >= totalAttempts) break;
      await sleep(calculateBackoffDelay(attempt));
    }
  }
  throw new Error(lastError?.message || 'Failed to generate summary.');
}

// ─── Experience Bullets ─────────────────────────────────────────────────────
// Concise bullets (max 20 words each) with mandatory metrics and tech stack mention
async function generateExperienceBullets(company, role, duration, existingDescription, userId = null) {
  const client = getClient();
  const systemMsg = [
    'You are a professional resume writer specializing in ATS-optimized bullet points.',
    'Write achievement-focused bullets with metrics.',
    'Keep bullets concise — max 20 words per bullet.',
    'Never exceed 20 words per bullet point.',
  ].join(' ');

  const userMsg = [
    'Write 2-3 bullet points for a job experience entry. Rules:',
    '1. Each bullet MAX 18-20 words — concise and punchy',
    '2. MUST include at least one metric/number (%, time saved, count, user scale)',
    '   Example metrics: "by 20%", "reducing latency by 30%", "5+ features", "1000+ users"',
    '3. Mention the specific tech stack used (frameworks, tools, languages)',
    '   Example: "using Spring Boot and JWT", "with React.js and MySQL"',
    '4. Start each bullet with a strong action verb:',
    '   (Built, Engineered, Optimized, Reduced, Improved, Led, Deployed, Launched, Architected)',
    '5. Focus on IMPACT not just tasks',
    '6. Do NOT start with or mention the person\'s name',
    '7. Format: plain text, one bullet per line, starting with "-"',
    '',
    'Role: ' + (role || 'Not provided'),
    'Company: ' + (company || 'Not provided'),
    'Duration: ' + (duration || 'Not provided'),
    'Tech used / Key responsibilities: ' + (existingDescription || 'Not provided'),
    '',
    'Write 2-3 bullet points (max 20 words each):',
  ].join('\n');

  const totalAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError;
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
      });
      const text = (response.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error('GPT returned empty experience bullets.');
      trackTokens(userId, 'builder', response.usage);
      logger.info('[Experience] Generated ' + text.length + ' chars');
      return text;
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt >= totalAttempts) break;
      await sleep(calculateBackoffDelay(attempt));
    }
  }
  throw new Error(lastError?.message || 'Failed to generate experience bullets.');
}

// ─── Project Description ────────────────────────────────────────────────────
// Focuses on impact/problem — does NOT repeat primary tech stack (already shown separately)
async function generateProjectDescription(projectTitle, techStack, existingDescription, userId = null) {
  const client = getClient();
  const systemMsg = [
    'You are a professional resume writer.',
    'Write impactful project descriptions that highlight what was built and the impact.',
    'The tech stack is already listed separately on the resume — do NOT repeat primary technologies.',
    'Focus on the problem solved, key feature built, or measurable impact.',
    'Keep each bullet under 20 words.',
  ].join(' ');

  const userMsg = [
    'Write 2 bullet points for a project description. Rules:',
    '1. Each bullet MAX 15-20 words',
    '2. DO NOT mention the primary tech stack — it is already listed separately on the resume',
    '   Primary stack (do NOT repeat): ' + (techStack || 'Not provided'),
    '   You CAN mention secondary implementation details (JWT sessions, REST APIs, webhooks, etc.)',
    '3. Focus on: what problem it solves, key feature built, or the impact',
    '4. Include 1 metric if possible (users, performance gain, time saved, accuracy, etc.)',
    '5. Start each bullet with a strong action verb',
    '6. Format: plain text, one bullet per line, starting with "-"',
    '',
    'Project: ' + (projectTitle || 'Not provided'),
    'Tech stack (DO NOT repeat these): ' + (techStack || 'Not provided'),
    'Description provided by user: ' + (existingDescription || 'Not provided'),
    '',
    'Write 2 bullet points (max 20 words each, no tech stack repetition):',
  ].join('\n');

  const totalAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError;
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
      });
      const text = (response.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error('GPT returned empty project description.');
      trackTokens(userId, 'builder', response.usage);
      logger.info('[Project] Generated ' + text.length + ' chars (no-tech-repeat prompt)');
      return text;
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt >= totalAttempts) break;
      await sleep(calculateBackoffDelay(attempt));
    }
  }
  throw new Error(lastError?.message || 'Failed to generate project description.');
}

// ─── Full Resume ──────────────────────────────────────────────────────────────
async function generateFullResume(name, skills, experienceInput, userId = null, projectsInput = '') {
  const prompt = `You are an expert ATS resume writer. Generate professional resume content based on the user's details.
Respond with ONLY valid JSON — no other text, no markdown.

Candidate Name: ${name || 'Not provided'}
Skills: ${skills || 'Not provided'}
Work Experience: ${experienceInput || 'Not provided'}
Projects: ${projectsInput || 'Not provided'}

Instructions:
- Write a compelling 3-4 sentence professional summary
- For each experience, write exactly 3 ATS-friendly bullet points starting with action verbs. Use the provided rough descriptions as context to make them specific and accurate.
- For each project, write exactly 2 bullet points highlighting what was built and its impact. Use the provided rough descriptions as context.
- Extract and suggest 8-12 targeted skills from the profile

Return EXACTLY this JSON:
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
      "techStack": "comma-separated technologies",
      "description": "- bullet one\\n- bullet two"
    }
  ]
}`;

  const raw = await callGPT(prompt, true, 'builder', userId);
  return extractJson(raw);
}

// ─── Regenerate a single Magic Write suggestion ───────────────────────────────
// Used by POST /api/resume/regenerate-suggestion
async function regenerateSuggestion(originalText, issueType, section, resumeContext, userId = null) {
  const prompt = `You are an expert ATS resume writer. Rewrite ONLY the following resume line/bullet to fix the stated issue.

RULES (STRICTLY FOLLOW):
1. Start with a strong, specific action verb (Led, Engineered, Achieved, Delivered, Built, Deployed, Reduced, Increased, Streamlined, Developed — vary based on context).
   Do NOT use: worked, helped, assisted, managed (unless genuinely senior leadership), handled, was responsible for.
2. Add a realistic, plausible metric if missing (e.g., "reduced load time by 40%", "serving 10K+ users", "cutting costs by 25%").
   Base metrics on context from the resume and section. Do NOT invent unrealistic numbers.
3. Rewritten line minimum 20-25 words honi chahiye, regardless of original length. Never write a suggestion shorter than the original.
4. Make it ATS-keyword-rich for the inferred role/domain.
5. Remove ALL filler phrases: "team player", "hardworking", "passionate about", "results-driven", "detail-oriented".
6. Output ONLY the rewritten line — no explanation, no bullets prefix, no JSON, no markdown.

Original line (from ${section} section):
${originalText}

Issue type: ${issueType}

Resume context (for domain/role awareness):
${(resumeContext || '').slice(0, 1500)}

Write ONLY the improved line:`;

  const raw = await callGPT(prompt, false, 'magic_write', userId, 0.7);
  // Strip any leading bullet/dash/asterisk that GPT might add
  return raw.trim().replace(/^[-•*]\s+/, '');
}

/**
 * Parses raw text extracted from a resume file into a structured JSON format using GPT-4o.
 */
async function extractResumeFromText(text, userId = null) {
  const prompt = `Extract resume information from this text and return 
  ONLY a valid JSON object with these exact fields:
  {
    "personalInfo": {
      "fullName": string,
      "email": string,
      "phone": string,
      "location": string,
      "linkedin": string,
      "github": string,
      "portfolio": string,
      "jobTitle": string
    },
    "summary": string,
    "experience": [{
      "company": string,
      "role": string,
      "startDate": string,
      "endDate": string,
      "location": string,
      "description": string,
      "bullets": [string]
    }],
    "education": [{
      "degree": string,
      "institution": string,
      "startYear": string,
      "endYear": string,
      "gpa": string,
      "location": string
    }],
    "skills": [string],
    "projects": [{
      "name": string,
      "technologies": string,
      "startDate": string,
      "endDate": string,
      "description": string,
      "link": string
    }],
    "certifications": [{
      "name": string,
      "issuer": string,
      "date": string,
      "link": string
    }],
    "languages": [{
      "name": string,
      "proficiency": string
    }]
  }
  Return only JSON, no explanation, no markdown.

  Resume Text:
  ${text}`;

  const raw = await callGPT(prompt, true, 'resume_builder_extract', userId);
  const cleanJson = extractJson(raw);
  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    logger.error(`Failed to parse AI resume extraction JSON: ${err.message}`);
    throw new Error('AI could not parse the resume text into the required format. Please try again.');
  }
}

async function generateTargetedInterviewQuestions(jobTitle, companyName, jobDescription, resumeText, count, userId = null) {
  const prompt = `You are a strict, professional interviewer at ${companyName}.
You are interviewing a candidate for the role of ${jobTitle}.

Job Description:
${jobDescription}

Candidate's Resume:
${resumeText || 'No resume provided.'}

RULES YOU MUST FOLLOW:
1. Ask questions ONLY relevant to this specific job 
   and this candidate's actual background
2. Reference specific things from their resume 
   — their projects, skills, experience
3. Reference specific requirements from the job description
4. Mix question types:
   - Technical questions based on JD tech stack
   - Behavioral questions relevant to the role
   - Resume deep-dive questions on their projects/experience
   - Company/role specific situational questions
5. NEVER ask generic questions like 
   'tell me about yourself' without context
6. Keep track of interview progress
7. After 8-10 questions, end with overall assessment

Start by introducing yourself as the interviewer 
and asking the first question immediately.

Respond with ONLY a valid JSON object matching this schema:
{
  "detectedDomain": "tech",
  "difficulty": "medium",
  "questions": [
    {
      "question": "The first question where you introduce yourself as the interviewer at ${companyName} for the ${jobTitle} role and ask the first question immediately.",
      "type": "TECHNICAL"
    },
    {
      "question": "The second question...",
      "type": "PROJECT"
    }
  ]
}

Generate exactly ${count} questions. No other text. JSON only.`;

  const raw = await callGPT(prompt, true, 'interview', userId);
  return extractJson(raw);
}

async function evaluateTargetedAnswer(question, answer, jobTitle, companyName, jobDescription, resumeText, userId = null) {
  const prompt = `You are a strict, professional interviewer at ${companyName} interviewing a candidate for the role of ${jobTitle}.
You are evaluating the candidate's answer to this specific interview question.

Job Description:
${jobDescription}

Candidate's Resume:
${resumeText || 'No resume provided.'}

Question: ${question}
Candidate Answer: ${answer}

EVALUATION RULES (STRICTLY FOLLOW):
- Evaluate ONLY the correctness, depth, and relevance of the answer to the job and candidate's background.
- Give a score from 0.0 to 10.0 with one decimal place.
- Provide sharp, brief feedback containing:
  1. What was good (strengths)
  2. What was missing (weaknesses)
  3. A follow-up question if the answer was weak (score < 7.0). Mention it at the end of weaknesses or strengths.
- Ignore minor grammar/spelling errors unless they hinder technical meaning.

Return EXACTLY this JSON format (no markdown, no extra text):
{
  "score": <number 0.0-10.0 with one decimal>,
  "strengths": "Brief sharp feedback on what was good in this answer",
  "weaknesses": "Brief sharp feedback on what was missing/incorrect. If the answer was weak (score < 7.0), you must append a follow-up question here.",
  "improvedAnswer": "A professional model answer for this role"
}
`;

  const raw = await callGPT(prompt, true, 'interview', userId);
  return extractJson(raw);
}

async function evaluateTargetedSession(jobTitle, companyName, jobDescription, resumeText, qaList, userId = null) {
  const formattedQa = qaList.map((qa, index) => {
    return `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.skipped ? 'Skipped' : (qa.answer || '')}`;
  }).join('\n\n');

  const prompt = `You are a strict, professional interviewer at ${companyName}.
You have just finished interviewing a candidate for the role of ${jobTitle}.

Job Description:
${jobDescription}

Candidate's Resume:
${resumeText || 'No resume provided.'}

Here is the transcript of the interview:
${formattedQa}

Evaluate the candidate's performance across the entire interview session.
Return a summary report containing:
1. Overall performance score on a scale of 0 to 10 with one decimal place.
2. Strengths identified (be detailed, reference specific answers or projects).
3. Areas to improve (be detailed, point out what was missing).
4. Top 3 skills to brush up for this specific role.

Respond with ONLY a valid JSON object matching this schema:
{
  "overallScore": <number 0.0-10.0>,
  "strengths": "detailed strengths identified",
  "weaknesses": "detailed areas to improve",
  "skillsToBrushUp": ["skill 1", "skill 2", "skill 3"]
}

No other text. JSON only.`;

  const raw = await callGPT(prompt, true, 'interview', userId);
  return extractJson(raw);
}

module.exports = {
  validateIsResume,
  analyzeResume,
  generateInterviewQuestions,
  evaluateAnswer,
  generateResumeSummary,
  generateExperienceBullets,
  generateProjectDescription,
  generateFullResume,
  regenerateSuggestion,
  extractTextFromImagePdf,
  extractResumeFromText,
  generateTargetedInterviewQuestions,
  evaluateTargetedAnswer,
  evaluateTargetedSession,
};
