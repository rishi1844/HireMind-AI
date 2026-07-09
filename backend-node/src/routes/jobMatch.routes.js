// src/routes/jobMatch.routes.js — Job Description Matcher routes (Phase 3.2)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { analyzeJobMatch } = require('../services/jobMatch.service');
const { checkUsageLimit } = require('../services/usageLimit.service');

/**
 * POST /api/job-match/analyze
 * Body: { resumeId, jobDescription }
 * Returns: { matchScore, verdict, summary, matchedKeywords, missingKeywords, sectionScores, tailoringTips, ... }
 */
router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    await checkUsageLimit(req.user.email, 'job_match');
    const result = await analyzeJobMatch(req.body, req.user.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

