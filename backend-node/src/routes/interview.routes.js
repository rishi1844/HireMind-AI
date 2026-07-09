// src/routes/interview.routes.js — All interview routes
const { Router } = require('express');
const interviewController = require('../controllers/interview.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { interviewLimiter } = require('../config/rateLimit');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/generate-questions — Generate interview questions (AI, 15/hr limit)
router.post('/generate-questions', interviewLimiter, interviewController.generateQuestions);

// POST /api/generate-targeted-questions — Generate targeted interview questions (AI, 15/hr limit)
router.post('/generate-targeted-questions', interviewLimiter, interviewController.generateTargetedQuestions);

// POST /api/evaluate-answer — Evaluate candidate answer (AI, 15/hr limit)
router.post('/evaluate-answer', interviewLimiter, interviewController.evaluateAnswer);

// POST /api/evaluate-targeted-answer — Evaluate targeted candidate answer (AI, 15/hr limit)
router.post('/evaluate-targeted-answer', interviewLimiter, interviewController.evaluateTargetedAnswer);

// POST /api/evaluate-targeted-session — Evaluate full targeted interview session (AI, 15/hr limit)
router.post('/evaluate-targeted-session', interviewLimiter, interviewController.evaluateTargetedSession);

// POST /api/interview/save-session — Save a completed session
router.post('/interview/save-session', interviewController.saveSession);

// GET /api/interview/history — Get user's session history
router.get('/interview/history', interviewController.getSessionHistory);

// GET /api/interview/session/:sessionId — Get session details
router.get('/interview/session/:sessionId', interviewController.getSession);

// DELETE /api/interview/session/:sessionId — Delete session
router.delete('/interview/session/:sessionId', interviewController.deleteSession);

// POST /api/interview/livekit-token — Generate LiveKit token
router.post('/interview/livekit-token', interviewController.getLiveKitToken);

module.exports = router;
