// src/routes/coverLetter.routes.js — Cover Letter Generator routes (Phase 3.1)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { generateCoverLetter } = require('../services/coverLetter.service');
const { checkUsageLimit } = require('../services/usageLimit.service');

/**
 * POST /api/cover-letter/generate
 * Body: { resumeId?, jobTitle, companyName, jobDescription, tone? }
 * Returns: { coverLetter, jobTitle, companyName, tone, generatedAt }
 */
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    await checkUsageLimit(req.user.email, 'cover_letter');
    const result = await generateCoverLetter(req.body, req.user.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
