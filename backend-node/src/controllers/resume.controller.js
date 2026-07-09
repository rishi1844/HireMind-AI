// src/controllers/resume.controller.js — Mirrors Spring ResumeController.java
const resumeService = require('../services/resume.service');

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded. Field name must be "file".');
      err.status = 400;
      return next(err);
    }
    const result = await resumeService.uploadResume(
      req.file.buffer,
      req.file.originalname,
      req.file.size,
      req.user.email
    );
    res.json(result);
  } catch (err) { next(err); }
}

async function analyzeResume(req, res, next) {
  try {
    const resumeId = req.body.resumeId || req.query.resumeId;
    if (!resumeId) {
      const err = new Error('resumeId is required');
      err.status = 400;
      return next(err);
    }
    const aiModel = req.body.aiModel || req.query.aiModel;
    const force = req.body.force === true || req.query.force === 'true';
    const result = await resumeService.analyzeResume(resumeId, req.user.email, aiModel, force);
    res.json(result);
  } catch (err) { next(err); }
}

async function getAnalysis(req, res, next) {
  try {
    const result = await resumeService.getAnalysisById(req.params.analysisId, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const result = await resumeService.getHistory(req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteResume(req, res, next) {
  try {
    await resumeService.deleteResume(req.params.resumeId, req.user.email);
    res.status(204).end();
  } catch (err) { next(err); }
}

// GET /api/resume/:resumeId/text — fetch raw extracted text for inline editor
async function getResumeText(req, res, next) {
  try {
    const result = await resumeService.getResumeText(req.params.resumeId, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

// POST /api/resume/regenerate-suggestion — Generate a fresh AI suggestion for one issue
async function regenerateSuggestion(req, res, next) {
  try {
    const { originalText, issueType, section, resumeContext } = req.body;
    if (!originalText) {
      const err = new Error('originalText is required');
      err.status = 400;
      return next(err);
    }
    const result = await resumeService.regenerateSuggestion({
      originalText,
      issueType,
      section,
      resumeContext,
      userEmail: req.user.email,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { uploadResume, analyzeResume, getAnalysis, getHistory, deleteResume, getResumeText, regenerateSuggestion };
