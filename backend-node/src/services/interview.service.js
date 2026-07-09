// src/services/interview.service.js — 100% AI-driven, uses unified ai.service.js
const prisma = require('../config/db');
const aiService = require('./ai.service');
const logger = require('../utils/logger');

// ─── Generate Questions ────────────────────────────────────────────────────────
async function generateQuestions(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  let resume = null;
  let resumeText = '';
  let resumeContext = 'No resume provided.';

  if (body.resumeId && Number(body.resumeId) > 0) {
    resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true, analysisResult: true },
    });
    if (!resume) throw new Error('Resume not found');
    if (resume.user.email !== userEmail) throw new Error('Unauthorized');
    resumeText = resume.extractedText || '';
    resumeContext = buildResumeSummary(resume);
  }

  const provider = aiService.resolveProvider(body.aiModel);
  logger.info(`Generating interview questions with ${provider.toUpperCase()}`);

  // 100% AI — will throw if unavailable
  const aiResponse = await aiService.generateInterviewQuestions(
    resumeText,
    resumeContext,
    hasText(body.name) ? body.name.trim() : user.name,
    hasText(body.skills) ? body.skills.trim() : 'Not provided',
    hasText(body.description) ? body.description.trim() : 'General interview preparation',
    body.count > 0 ? body.count : 10,
    body.aiModel,
    user.id,
    body.difficulty || 'medium',
    body.previousQuestions || []
  );

  return parseQuestionsResponse(aiResponse);
}

function buildResumeSummary(resume) {
  const lines = ['Candidate resume summary:'];
  if (resume.analysisResult) {
    const ar = resume.analysisResult;
    lines.push(`- ATS score: ${ar.atsScore}`);
    const toArray = (v) => { try { return v ? (Array.isArray(v) ? v : JSON.parse(v)) : []; } catch { return []; } };
    const roles = toArray(ar.jobRoles);
    const strengths = toArray(ar.strengths);
    const weaknesses = toArray(ar.weaknesses);
    if (roles.length > 0) lines.push(`- target roles: ${roles.join(', ')}`);
    if (strengths.length > 0) lines.push(`- strengths: ${strengths.join(', ')}`);
    if (weaknesses.length > 0) lines.push(`- weaknesses: ${weaknesses.join(', ')}`);
  } else {
    lines.push('- resume available with skills and project information.');
  }
  return lines.join('\n');
}

function parseQuestionsResponse(aiResponse) {
  try {
    const clean = (aiResponse || '').trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    const questions = (parsed.questions || []).map((q) => ({
      question: q.question,
      type: q.type || 'TECHNICAL',
    }));
    return { questions };
  } catch (err) {
    logger.error(`Error parsing questions response: ${err.message}`);
    throw new Error('AI returned an unexpected response format for questions. Please try again.');
  }
}

// ─── Evaluate Answer ──────────────────────────────────────────────────────────
async function evaluateAnswer(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  const userId = user?.id ?? null;

  const provider = aiService.resolveProvider(body.aiModel);
  logger.info(`Evaluating answer with ${provider.toUpperCase()}`);

  // 100% AI — will throw if unavailable
  const aiResponse = await aiService.evaluateAnswer(
    body.question,
    body.answer,
    body.resumeContext || '',
    body.aiModel,
    userId  // ✅ Fix: pass userId for token_usage tracking
  );

  return parseEvaluationResponse(aiResponse);
}

function parseEvaluationResponse(aiResponse) {
  try {
    const clean = (aiResponse || '').trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      score: parsed.score ?? 5.0,
      strengths: parsed.strengths || '',
      weaknesses: parsed.weaknesses || '',
      improvedAnswer: parsed.improvedAnswer || '',
    };
  } catch (err) {
    logger.error(`Error parsing evaluation response: ${err.message}`);
    throw new Error('AI returned an unexpected response for evaluation. Please try again.');
  }
}

// ─── Save Session ─────────────────────────────────────────────────────────────
async function saveSession(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  let resume = null;
  if (body.resumeId) {
    resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true },
    });
    if (!resume) throw new Error('Resume not found');
    if (resume.user.email !== userEmail) throw new Error('Unauthorized');
  }

  const qaList = body.qaList || [];
  const answered = qaList.filter((qa) => !qa.skipped && hasText(qa.answer));
  const scoredItems = qaList.filter((qa) => !qa.skipped && qa.score != null);
  const totalScore = scoredItems.length > 0
    ? scoredItems.reduce((sum, qa) => sum + Number(qa.score), 0) / scoredItems.length
    : 0.0;

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      resumeId: resume ? resume.id : null,
      resumeFileNameSnapshot: resume ? resume.fileName : null,
      sessionTitle: hasText(body.sessionTitle) ? body.sessionTitle.trim() : 'Interview Session',
      overallScore: totalScore,
      questionsAnswered: answered.length,
      createdAt: new Date(),
      qaList: {
        create: qaList.map((item, i) => ({
          question: item.question,
          questionType: item.questionType,
          answer: item.answer,
          inputMode: item.inputMode,
          score: item.score != null ? Number(item.score) : null,
          strengths: item.strengths,
          weaknesses: item.weaknesses,
          improvedAnswer: item.improvedAnswer,
          skipped: Boolean(item.skipped),
          orderIndex: i,
        })),
      },
    },
    include: { qaList: { orderBy: { orderIndex: 'asc' } } },
  });

  return mapToSessionResponse(session, resume);
}

// ─── Get Session History ──────────────────────────────────────────────────────
async function getSessionHistory(userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    include: { qaList: { orderBy: { orderIndex: 'asc' } }, resume: true },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map((s) => mapToSessionResponse(s, s.resume));
}

// ─── Get Session By ID ────────────────────────────────────────────────────────
async function getSessionById(sessionId, userEmail) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: BigInt(sessionId) },
    include: { user: true, qaList: { orderBy: { orderIndex: 'asc' } }, resume: true },
  });
  if (!session) throw new Error('Session not found');
  if (session.user.email !== userEmail) throw new Error('Unauthorized');
  return mapToSessionResponse(session, session.resume);
}

// ─── Delete Session ───────────────────────────────────────────────────────────
async function deleteSession(sessionId, userEmail) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: BigInt(sessionId) },
    include: { user: true },
  });
  if (!session) throw new Error('Session not found');
  if (session.user.email !== userEmail) throw new Error('Unauthorized');
  await prisma.interviewSession.delete({ where: { id: session.id } });
}

// ─── Mapper ───────────────────────────────────────────────────────────────────
function mapToSessionResponse(session, resume) {
  const qaItems = (session.qaList || []).map((qa) => ({
    question: qa.question,
    questionType: qa.questionType,
    answer: qa.answer,
    inputMode: qa.inputMode,
    score: qa.score,
    strengths: qa.strengths,
    weaknesses: qa.weaknesses,
    improvedAnswer: qa.improvedAnswer,
    skipped: Boolean(qa.skipped),
    orderIndex: qa.orderIndex,
  }));

  return {
    id: session.id.toString(),
    sessionTitle: session.sessionTitle,
    overallScore: session.overallScore,
    questionsAnswered: session.questionsAnswered,
    questionsAsked: qaItems.length,
    createdAt: session.createdAt ? session.createdAt.toISOString() : null,
    resumeId: session.resumeId ? session.resumeId.toString() : null,
    resumeFileName: session.resumeFileNameSnapshot || (resume ? resume.fileName : null),
    qaList: qaItems,
  };
}

function hasText(value) {
  return value != null && String(value).trim().length > 0;
}

async function generateTargetedQuestions(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');

  let resumeText = '';
  if (body.resumeId && Number(body.resumeId) > 0) {
    const resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true },
    });
    if (!resume) throw new Error('Resume not found');
    if (resume.user.email !== userEmail) throw new Error('Unauthorized');
    resumeText = resume.extractedText || '';
  } else if (body.resumeText) {
    resumeText = body.resumeText.trim();
  }

  const count = body.count > 0 ? body.count : 10;
  const aiResponse = await aiService.generateTargetedInterviewQuestions(
    body.jobTitle.trim(),
    body.companyName.trim(),
    body.jobDescription.trim(),
    resumeText,
    count,
    body.aiModel || 'gpt',
    user.id
  );

  return parseQuestionsResponse(aiResponse);
}

async function evaluateTargetedAnswer(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  const userId = user?.id ?? null;

  let resumeText = '';
  if (body.resumeId && Number(body.resumeId) > 0) {
    const resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true }
    });
    if (resume && resume.user.email === userEmail) {
      resumeText = resume.extractedText || '';
    }
  } else if (body.resumeText) {
    resumeText = body.resumeText.trim();
  }

  const aiResponse = await aiService.evaluateTargetedAnswer(
    body.question,
    body.answer,
    body.jobTitle,
    body.companyName,
    body.jobDescription,
    resumeText,
    body.aiModel || 'gpt',
    userId
  );

  return parseEvaluationResponse(aiResponse);
}

async function evaluateTargetedSession(body, userEmail) {
  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  const userId = user?.id ?? null;

  let resumeText = '';
  if (body.resumeId && Number(body.resumeId) > 0) {
    const resume = await prisma.resume.findUnique({
      where: { id: BigInt(body.resumeId) },
      include: { user: true }
    });
    if (resume && resume.user.email === userEmail) {
      resumeText = resume.extractedText || '';
    }
  } else if (body.resumeText) {
    resumeText = body.resumeText.trim();
  }

  const aiResponse = await aiService.evaluateTargetedSession(
    body.jobTitle,
    body.companyName,
    body.jobDescription,
    resumeText,
    body.qaList || [],
    body.aiModel || 'gpt',
    userId
  );

  try {
    const clean = (aiResponse || '').trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      overallScore: parsed.overallScore ?? 5.0,
      strengths: parsed.strengths || '',
      weaknesses: parsed.weaknesses || '',
      skillsToBrushUp: parsed.skillsToBrushUp || []
    };
  } catch (err) {
    logger.error(`Error parsing targeted session evaluation: ${err.message}`);
    throw new Error('AI returned an unexpected response format for session evaluation.');
  }
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  saveSession,
  getSessionHistory,
  getSessionById,
  deleteSession,
  generateTargetedQuestions,
  evaluateTargetedAnswer,
  evaluateTargetedSession,
};
