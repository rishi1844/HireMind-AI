// src/routes/resumeBuilder.routes.js — All /api/resume-builder/* routes
const { Router } = require('express');
const resumeBuilderController = require('../controllers/resumeBuilder.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { profileImageUpload, builderResumeUpload } = require('../middlewares/upload.middleware');
const { builderAiLimiter } = require('../config/rateLimit');

const router = Router();

// GET /api/resume-builder/print-token/validate — Validate print token (anonymous, must be before authMiddleware)
router.get('/print-token/validate', resumeBuilderController.validatePrintToken);

// All subsequent routes require auth
router.use(authMiddleware);

// POST /api/resume-builder — Create new built resume
router.post('/', resumeBuilderController.create);

// GET /api/resume-builder — Get all resumes for user
router.get('/', resumeBuilderController.getAll);

// POST /api/resume-builder/profile-image — Upload profile picture (MUST be before /:id)
router.post('/profile-image', profileImageUpload, resumeBuilderController.uploadProfileImage);

// POST /api/resume-builder/extract-resume — Extract resume details from file (PDF/Image) (MUST be before /:id)
router.post('/extract-resume', builderResumeUpload, resumeBuilderController.extractResume);

// POST /api/resume-builder/ai/generate-field — AI field generation (MUST be before /:id), 30/hr limit
router.post('/ai/generate-field', builderAiLimiter, resumeBuilderController.generateField);

// GET /api/resume-builder/:id — Get single resume
router.get('/:id', resumeBuilderController.getById);

// PUT /api/resume-builder/:id — Update resume
router.put('/:id', resumeBuilderController.update);

// DELETE /api/resume-builder/:id — Delete resume
router.delete('/:id', resumeBuilderController.deleteResume);

// GET /api/resume-builder/:id/export/pdf — Export to PDF (PDFKit server-side)
router.get('/:id/export/pdf', resumeBuilderController.exportPdf);

// GET /api/resume-builder/:id/export/docx — Export to DOCX
router.get('/:id/export/docx', resumeBuilderController.exportDocx);

// POST /api/resume-builder/:id/export/print-token — Create print token
router.post('/:id/export/print-token', resumeBuilderController.createPrintToken);

// POST /api/resume-builder/:id/export/email — Email resume (server-side PDF via Puppeteer / DOCX via docx)
router.post('/:id/export/email', resumeBuilderController.sendEmail);

// POST /api/resume-builder/:id/track-download — Enforce and track resume downloads/exports
router.post('/:id/track-download', resumeBuilderController.trackDownload);

module.exports = router;

