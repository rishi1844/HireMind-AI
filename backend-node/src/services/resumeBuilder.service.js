// src/services/resumeBuilder.service.js — Full port of Spring ResumeBuilderService.java
const prisma = require('../config/db');
const aiService = require('./ai.service');
const profileImageService = require('./profileImage.service');
const logger = require('../utils/logger');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const openaiService = require('./openai.service');

// ─── Create Resume ────────────────────────────────────────────────────────────
async function createResume(body, userEmail) {
  const user = await getUser(userEmail);

  const resume = await prisma.builtResume.create({
    data: {
      userId: user.id,
      title: body.title,
      templateId: body.templateId,
      resumeData: JSON.stringify(body.resumeData),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  logger.info(`Created built resume id=${resume.id} for user=${userEmail}`);
  return toResponse(resume);
}

// ─── Update Resume ────────────────────────────────────────────────────────────
async function updateResume(id, body, userEmail) {
  const user = await getUser(userEmail);
  const existing = await prisma.builtResume.findFirst({ where: { id: BigInt(id), userId: user.id } });
  if (!existing) throw new Error('Resume not found or access denied');

  const previousData = safeParseResumeData(existing.resumeData);

  const updated = await prisma.builtResume.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      templateId: body.templateId,
      resumeData: JSON.stringify(body.resumeData),
      updatedAt: new Date(),
    },
  });

  // Cleanup old profile image if replaced
  cleanupReplacedProfileImage(previousData, body.resumeData);
  logger.info(`Updated built resume id=${updated.id} for user=${userEmail}`);
  return toResponse(updated);
}

// ─── Get All Resumes ──────────────────────────────────────────────────────────
async function getAllResumes(userEmail) {
  const user = await getUser(userEmail);
  const resumes = await prisma.builtResume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
  return resumes.map(toListItem);
}

// ─── Get By ID ────────────────────────────────────────────────────────────────
async function getById(id, userEmail) {
  const user = await getUser(userEmail);
  const resume = await prisma.builtResume.findFirst({ where: { id: BigInt(id), userId: user.id } });
  if (!resume) throw new Error('Resume not found or access denied');
  return toResponse(resume);
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteById(id, userEmail) {
  const user = await getUser(userEmail);
  const resume = await prisma.builtResume.findFirst({ where: { id: BigInt(id), userId: user.id } });
  if (!resume) throw new Error('Resume not found or access denied');

  const data = safeParseResumeData(resume.resumeData);
  if (profileImageService.isManagedPath(data.profileImageUrl)) {
    await profileImageService.deleteManagedFile(data.profileImageUrl);
  }

  await prisma.builtResume.delete({ where: { id: resume.id } });
  logger.info(`Deleted built resume id=${id} for user=${userEmail}`);
}

// ─── Upload Profile Image ─────────────────────────────────────────────────────
async function uploadProfileImage(fileBuffer, mimetype, userEmail) {
  const user = await getUser(userEmail);
  const imageUrl = await profileImageService.replaceProfileImage(null, fileBuffer, mimetype, user.id.toString());
  return { imageUrl };
}

// ─── AI Generate Field ────────────────────────────────────────────────────────
async function generateField(body, _userEmail) {
  const aiModel = body.aiModel; // passed from frontend
  const ft = (body.fieldType || '').toLowerCase();
  const provider = aiService.resolveProvider(aiModel);
  logger.info(`Generating field="${ft}" with ${provider.toUpperCase()}`);

  let generatedText;
  // hint is the user-provided context/brief that personalises the generation
  const hint = (body.hint || '').trim();

  switch (ft) {
    case 'summary':
      generatedText = await aiService.generateResumeSummary(
        body.name, body.skills,
        hint ? `${body.experienceInput || ''}. Additional context: ${hint}` : body.experienceInput,
        body.targetRole, aiModel
      );
      break;
    case 'experience':
      generatedText = await aiService.generateExperienceBullets(
        body.company, body.role, body.duration,
        hint || body.existingDescription,
        aiModel
      );
      break;
    case 'project':
      generatedText = await aiService.generateProjectDescription(
        body.projectTitle, body.techStack,
        hint || body.existingDescription,
        aiModel
      );
      break;
    case 'full':
      generatedText = await aiService.generateFullResume(
        body.name, body.skills,
        hint ? `${body.experienceInput || ''}. Additional context: ${hint}` : body.experienceInput,
        aiModel, body.existingDescription || ''
      );
      break;
    default:
      throw new Error('Unknown fieldType: ' + body.fieldType);
  }

  return { generatedText, fieldType: body.fieldType };
}

// ─── Get Raw (for export) ─────────────────────────────────────────────────────
async function getRawById(id, userEmail) {
  const user = await getUser(userEmail);
  const resume = await prisma.builtResume.findFirst({ where: { id: BigInt(id), userId: user.id } });
  if (!resume) throw new Error('Resume not found or access denied');
  return resume;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found: ' + email);
  return user;
}

function safeParseResumeData(json) {
  try { return json ? JSON.parse(json) : {}; }
  catch { return {}; }
}

function cleanupReplacedProfileImage(previousData, nextData) {
  const current = previousData?.profileImageUrl;
  const updated = nextData?.profileImageUrl;
  if (current && current !== updated && profileImageService.isManagedPath(current)) {
    profileImageService.deleteManagedFile(current).catch(() => {});
  }
}

function toResponse(resume) {
  return {
    id: resume.id.toString(),
    title: resume.title,
    templateId: resume.templateId,
    resumeData: safeParseResumeData(resume.resumeData),
    createdAt: resume.createdAt ? resume.createdAt.toISOString() : null,
    updatedAt: resume.updatedAt ? resume.updatedAt.toISOString() : null,
  };
}

function toListItem(resume) {
  return {
    id: resume.id.toString(),
    title: resume.title,
    templateId: resume.templateId,
    createdAt: resume.createdAt ? resume.createdAt.toISOString() : null,
    updatedAt: resume.updatedAt ? resume.updatedAt.toISOString() : null,
  };
}

/**
 * Extracts resume content from PDF/Image using pdf-parse/Tesseract and structures it via AI.
 */
async function extractResumeData(fileBuffer, mimetype, userId = null) {
  let extractedText = '';

  if (mimetype === 'application/pdf') {
    try {
      const parsed = await pdfParse(fileBuffer);
      extractedText = parsed.text || '';
    } catch (err) {
      logger.error(`PDF text extraction failed: ${err.message}`);
      throw new Error('Could not extract text from the PDF file.');
    }
  } else if (mimetype.startsWith('image/')) {
    try {
      logger.info('[OCR] Starting image OCR via Tesseract.js...');
      const result = await Tesseract.recognize(fileBuffer, 'eng');
      extractedText = result.data.text || '';
    } catch (err) {
      logger.error(`Image OCR failed: ${err.message}`);
      throw new Error('Could not extract text from the image file.');
    }
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or an image (JPG, PNG).');
  }

  extractedText = extractedText.trim();
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 10) {
    throw new Error('The document is too short or contains no readable text. Please upload a valid resume.');
  }

  logger.info(`[ResumeBuilder] Extracted ${wordCount} words from file. Sending to AI...`);
  const parsedData = await openaiService.extractResumeFromText(extractedText, userId);
  return parsedData;
}

module.exports = {
  createResume,
  updateResume,
  getAllResumes,
  getById,
  deleteById,
  uploadProfileImage,
  generateField,
  getRawById,
  extractResumeData,
};
