// src/services/resume.service.js — 100% AI-driven, uses unified ai.service.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const prisma = require('../config/db');
const aiService = require('./ai.service');
const openaiService = require('./openai.service');
const logger = require('../utils/logger');

// Ensure upload directory exists
const RESUME_UPLOAD_DIR = path.resolve('./uploads/resumes');
if (!fs.existsSync(RESUME_UPLOAD_DIR)) fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });

// ─── Content Hash Helper ────────────────────────────────────────────────────
// Hash is based on normalized text content (NOT filename).
// Same file, different name  → same hash  → DUPLICATE
// Different file, same name  → diff hash  → NOT duplicate
function computeContentHash(text) {
  const normalized = (text || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 5000);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// ─── Upload Resume ─────────────────────────────────────────────────────────────
async function uploadResume(fileBuffer, originalName, fileSize, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  let extractedText = '';
  try {
    const parsed = await pdfParse(fileBuffer);
    extractedText = parsed.text || '';
  } catch (err) {
    logger.warn(`PDF text extraction failed for ${originalName}: ${err.message}`);
    extractedText = '';
  }

  // ── Word count gate: if < 100 words, try GPT-4o Vision OCR first ────────────
  const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
  let ocrUsed = false;

  if (wordCount < 100) {
    logger.info(`[Upload] PDF text sparse (${wordCount} words) — attempting GPT-4o Vision OCR for ${originalName}`);
    try {
      const ocrText = await openaiService.extractTextFromImagePdf(fileBuffer, user.id.toString());
      const ocrWordCount = ocrText.trim().split(/\s+/).filter(Boolean).length;

      if (ocrWordCount >= 100) {
        logger.info(`[Upload] OCR succeeded: extracted ${ocrWordCount} words from image PDF`);
        extractedText = ocrText;
        ocrUsed = true;
      } else {
        // OCR also produced too little — throw the original error
        logger.warn(`[Upload] OCR produced only ${ocrWordCount} words — rejecting upload`);
        const err = new Error(
          ocrWordCount === 0
            ? 'This PDF appears to be blank or image-based and could not be read even with OCR. Please upload a text-based PDF resume.'
            : `This document is too short to be a resume (less than 100 words found, minimum 100 required). Please upload a valid resume.`
        );
        err.status = 422;
        throw err;
      }
    } catch (err) {
      if (err.status === 422) throw err; // rethrow our own error
      // OCR call itself failed (network/API error) — fall through to original rejection
      logger.warn(`[Upload] OCR fallback failed: ${err.message}`);
      const origErr = new Error(
        wordCount === 0
          ? 'This PDF appears to be blank or image-based and cannot be read. Please upload a text-based PDF resume.'
          : `This document is too short to be a resume (less than 100 words found, minimum 100 required). Please upload a valid resume.`
      );
      origErr.status = 422;
      throw origErr;
    }
  }

  // ── GPT validation: is this actually a resume? ────────────────────────────────
  logger.info(`[Upload] Running resume validation for: ${originalName} (${wordCount} words)`);
  const validation = await openaiService.validateIsResume(extractedText, user.id.toString());
  if (!validation.isResume) {
    logger.warn(`[Upload] Non-resume rejected for user ${userEmail}: ${validation.reason}`);
    const err = new Error(
      `This doesn't appear to be a resume. ${validation.reason} Please upload a valid professional resume.`
    );
    err.status = 422;
    throw err;
  }
  logger.info(`[Upload] Validation passed for: ${originalName}`);

  // ── Duplicate Detection (content-hash based) ──────────────────────────────
  // At this point, extractedText is guaranteed to have >= 100 words (validated above)
  const contentHash = computeContentHash(extractedText);

  const existing = await prisma.resume.findFirst({
    where: { userId: user.id, contentHash },
    include: { analysisResult: true },
  });

  if (existing) {
    logger.info(`Duplicate resume detected for user ${userEmail}: hash=${contentHash}`);
    return {
      id: existing.id.toString(),
      fileName: existing.fileName,
      fileSize: existing.fileSize?.toString() ?? '0',
      uploadedAt: existing.uploadedAt ? existing.uploadedAt.toISOString() : null,
      hasAnalysis: !!existing.analysisResult,
      filePath: existing.filePath ?? null,
      isDuplicate: true,
      duplicateMessage: `This resume content already exists as "${existing.fileName}" uploaded earlier. We returned the existing record.`,
    };
  }

  // Create DB record first to get the ID
  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      fileName: originalName,
      fileSize: BigInt(fileSize),
      extractedText,
      contentHash,
      uploadedAt: new Date(),
    },
  });

  // Save PDF file to disk: uploads/resumes/{id}.pdf
  let filePath = null;
  try {
    const diskFileName = `${resume.id}.pdf`;
    const diskFilePath = path.join(RESUME_UPLOAD_DIR, diskFileName);
    fs.writeFileSync(diskFilePath, fileBuffer);
    filePath = `/uploads/resumes/${diskFileName}`;
    // Update DB with file path
    await prisma.resume.update({ where: { id: resume.id }, data: { filePath } });
    logger.info(`PDF saved to disk: ${diskFilePath}`);
  } catch (err) {
    logger.warn(`Failed to save PDF to disk: ${err.message}`);
  }

  return {
    id: resume.id.toString(),
    fileName: resume.fileName,
    fileSize: resume.fileSize.toString(),
    uploadedAt: resume.uploadedAt ? resume.uploadedAt.toISOString() : null,
    hasAnalysis: false,
    filePath,
    isDuplicate: false,
    emptyText: false,
    ocrUsed,  // true if image-based PDF was processed via GPT-4o Vision OCR
  };
}

// ─── Analyze Resume ───────────────────────────────────────────────────────────
async function analyzeResume(resumeId, userEmail, aiModel, force = false) {
  const resume = await prisma.resume.findUnique({
    where: { id: BigInt(resumeId) },
    include: { user: true },
  });
  if (!resume) throw new Error('Resume not found');
  if (resume.user.email !== userEmail) throw new Error('Unauthorized access to resume');

  // Return cached result unless force re-analysis is requested
  const existing = await prisma.analysisResult.findUnique({ where: { resumeId: resume.id } });
  if (existing && !force) return mapToAnalysisResponse(existing, resume);

  // Delete old result if forcing re-analysis
  if (existing && force) {
    await prisma.analysisResult.delete({ where: { id: existing.id } });
  }

  const provider = aiService.resolveProvider(aiModel);
  logger.info(`Analyzing resume id=${resumeId} with ${provider.toUpperCase()}`);

  // 100% AI — will throw if AI is unavailable
  const aiResponse = await aiService.analyzeResume(resume.extractedText || '', aiModel, resume.user.id, force);
  const result = await parseAndSaveAnalysis(aiResponse, resume);
  return mapToAnalysisResponse(result, resume);
}

async function parseAndSaveAnalysis(aiResponse, resume) {
  const toDbJson = (val) => {
    try {
      if (!val) return JSON.stringify([]);
      if (Array.isArray(val)) return JSON.stringify(val);
      if (typeof val === 'object') return JSON.stringify(val);
      const parsed = JSON.parse(String(val));
      return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
      return JSON.stringify([]);
    }
  };

  try {
    let cleanJson = (aiResponse || '').trim();
    cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const start = cleanJson.indexOf('{');
    const end = cleanJson.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleanJson = cleanJson.slice(start, end + 1);
    }

    logger.info(`[Analysis] Parsing AI response (${cleanJson.length} chars)`);
    const parsed = JSON.parse(cleanJson);

    if (parsed.atsScore === undefined && parsed.ats_score === undefined) {
      logger.warn('[Analysis] AI response missing atsScore field. Fields: ' + Object.keys(parsed).join(', '));
    }

    const atsScore = Number(parsed.atsScore ?? parsed.ats_score ?? 0) || 0;

    const result = await prisma.analysisResult.create({
      data: {
        resumeId: resume.id,
        atsScore,
        strengths: toDbJson(parsed.strengths),
        weaknesses: toDbJson(parsed.weaknesses),
        improvements: toDbJson(parsed.improvements),
        jobRoles: toDbJson(parsed.jobRoles ?? parsed.job_roles),
        projectSuggestions: toDbJson(parsed.projectSuggestions ?? parsed.project_suggestions),
        quickPracticeQa: toDbJson(parsed.quickPractice ?? parsed.quickPracticeQa ?? parsed.quick_practice),
        issueAnnotations: toDbJson(parsed.issueAnnotations ?? []),
        // ─── NEW FIELDS ───────────────────────────────────────────────
        categories: JSON.stringify(parsed.categories ?? {}),
        bulletAnalysis: toDbJson(parsed.bulletAnalysis ?? []),
        repeatedWords: toDbJson(parsed.repeatedWords ?? []),
        industryKeywords: toDbJson(parsed.industryKeywords ?? []),
        // ──────────────────────────────────────────────────────────────
        analyzedAt: new Date(),
      },
    });
    return result;
  } catch (err) {
    logger.error(`[Analysis] Save failed: ${err.message}`);
    logger.error(`[Analysis] Raw AI response (first 600 chars): ${String(aiResponse || '').slice(0, 600)}`);
    throw new Error('Analysis failed: ' + err.message);
  }
}

// ─── Get Analysis By ID ───────────────────────────────────────────────────────
async function getAnalysisById(analysisId, userEmail) {
  const result = await prisma.analysisResult.findUnique({
    where: { id: BigInt(analysisId) },
    include: { resume: { include: { user: true } } },
  });
  if (!result) throw new Error('Analysis not found');
  if (result.resume.user.email !== userEmail) throw new Error('Unauthorized');
  return mapToAnalysisResponse(result, result.resume);
}

// ─── Get History ──────────────────────────────────────────────────────────────
async function getHistory(userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: { analysisResult: true },
    orderBy: { uploadedAt: 'desc' },
  });

  return resumes.map((resume) => {
    const item = {
      resumeId: resume.id.toString(),
      fileName: resume.fileName,
      filePath: resume.filePath || null,
      uploadedAt: resume.uploadedAt ? resume.uploadedAt.toISOString() : null,
    };
    if (resume.analysisResult) {
      item.analysisId = resume.analysisResult.id.toString();
      item.atsScore = resume.analysisResult.atsScore;
      item.analyzedAt = resume.analysisResult.analyzedAt ? resume.analysisResult.analyzedAt.toISOString() : null;
    }
    return item;
  });
}

// ─── Delete Resume ────────────────────────────────────────────────────────────
async function deleteResume(resumeId, userEmail) {
  const resume = await prisma.resume.findUnique({
    where: { id: BigInt(resumeId) },
    include: { user: true },
  });
  if (!resume) throw new Error('Resume not found');
  if (resume.user.email !== userEmail) throw new Error('Unauthorized access to resume');

  // 1. Nullify resumeId on linked interview sessions (preserve session history)
  const linkedSessions = await prisma.interviewSession.findMany({ where: { resumeId: resume.id } });
  for (const session of linkedSessions) {
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        resumeId: null,
        resumeFileNameSnapshot: session.resumeFileNameSnapshot || resume.fileName,
      },
    });
  }

  // 2. Delete analysis results (FK: analysis_results.resume_id → resumes.id)
  await prisma.analysisResult.deleteMany({ where: { resumeId: resume.id } });

  // 3. Delete resume sections (FK: resume_sections.resume_id → resumes.id)
  await prisma.resume_sections.deleteMany({ where: { resume_id: resume.id } });

  // 4. Now safely delete the resume itself
  await prisma.resume.delete({ where: { id: resume.id } });
}

// ─── Response Mapper ──────────────────────────────────────────────────────────
function mapToAnalysisResponse(result, resume) {
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(String(val)); } catch { return []; }
  };

  const toObject = (val, fallback = {}) => {
    if (!val) return fallback;
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    try { return JSON.parse(String(val)); } catch { return fallback; }
  };

  return {
    id: result.id.toString(),
    resumeId: resume.id.toString(),
    fileName: resume.fileName,
    atsScore: result.atsScore,
    analyzedAt: result.analyzedAt ? result.analyzedAt.toISOString() : null,
    strengths: toArray(result.strengths),
    weaknesses: toArray(result.weaknesses),
    improvements: toArray(result.improvements),
    jobRoles: toArray(result.jobRoles),
    projectSuggestions: toArray(result.projectSuggestions),
    quickPractice: toArray(result.quickPracticeQa),
    // ─── NEW FIELDS ───────────────────────────
    categories: toObject(result.categories),
    bulletAnalysis: toArray(result.bulletAnalysis),
    repeatedWords: toArray(result.repeatedWords),
    industryKeywords: toArray(result.industryKeywords),
    issueAnnotations: toArray(result.issueAnnotations),
    // ─────────────────────────────────────────────────────
  };
}

// ─── Get Resume Text + File path (for inline PDF editor) ─────────────────────
async function getResumeText(resumeId, userEmail) {
  const resume = await prisma.resume.findUnique({
    where: { id: BigInt(resumeId) },
    include: { user: true, analysisResult: true },
  });
  if (!resume) throw new Error('Resume not found');
  if (resume.user.email !== userEmail) throw new Error('Unauthorized');

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(String(val)); } catch { return []; }
  };

  const toObject = (val, fallback = {}) => {
    if (!val) return fallback;
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    try { return JSON.parse(String(val)); } catch { return fallback; }
  };

  const ar = resume.analysisResult;

  return {
    resumeId: resume.id.toString(),
    fileName: resume.fileName,
    filePath: resume.filePath || null,
    extractedText: resume.extractedText || '',
    issueAnnotations: toArray(ar?.issueAnnotations),
    analysisId: ar?.id?.toString() || null,
    atsScore: ar?.atsScore ?? null,
    // ─── NEW FIELDS ───────────────────────────────────────
    categories: toObject(ar?.categories),
    bulletAnalysis: toArray(ar?.bulletAnalysis),
    repeatedWords: toArray(ar?.repeatedWords),
    industryKeywords: toArray(ar?.industryKeywords),
    // ──────────────────────────────────────────────────────
  };
}

// ─── Regenerate a single Magic Write suggestion ───────────────────────────────
async function regenerateSuggestion({ originalText, issueType, section, resumeContext, userEmail }) {
  if (!originalText) {
    const err = new Error('originalText is required');
    err.status = 400;
    throw err;
  }
  const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;
  const userId = user ? user.id.toString() : null;
  const improvedText = await openaiService.regenerateSuggestion(
    originalText,
    issueType || 'general',
    section || 'General',
    resumeContext || '',
    userId
  );
  return { improvedText };
}

module.exports = { uploadResume, analyzeResume, getAnalysisById, getHistory, deleteResume, getResumeText, regenerateSuggestion };

// This is resume.service.js