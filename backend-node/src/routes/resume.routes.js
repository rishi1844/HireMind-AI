// src/routes/resume.routes.js — All resume upload/analysis routes
const { Router } = require('express');
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { resumeUpload } = require('../middlewares/upload.middleware');
const { analysisLimiter } = require('../config/rateLimit');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/upload-resume — Upload a PDF resume file (10/hr limit)
router.post('/upload-resume', analysisLimiter, resumeUpload, resumeController.uploadResume);

// POST /api/analyze — Trigger AI analysis (10 analyses/hr limit)
router.post('/analyze', analysisLimiter, resumeController.analyzeResume);

// GET /api/analysis/:analysisId — Get a specific analysis result
router.get('/analysis/:analysisId', resumeController.getAnalysis);

// GET /api/history — Get user's resume upload history
router.get('/history', resumeController.getHistory);

// DELETE /api/history/:resumeId — Delete a resume and its analysis
router.delete('/history/:resumeId', resumeController.deleteResume);

// GET /api/resume/:resumeId/text — Get extracted text + issue annotations (for inline editor)
router.get('/resume/:resumeId/text', resumeController.getResumeText);

// POST /api/resume/regenerate-suggestion — Regenerate a single Magic Write AI suggestion
router.post('/resume/regenerate-suggestion', resumeController.regenerateSuggestion);

module.exports = router;
