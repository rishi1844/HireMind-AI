// src/routes/builderTips.routes.js — Real-time Resume Builder Tips (Phase 3.3)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { generateBuilderTips } = require('../services/builderTips.service');
const { checkUsageLimit } = require('../services/usageLimit.service');

/**
 * POST /api/resume-builder/ai/tips
 * Body: { step, resumeData (partial) }
 * Returns: { tips: string[] }
 */
router.post('/ai/tips', authenticate, async (req, res, next) => {
  try {
    await checkUsageLimit(req.user.email, 'builder');
    const result = await generateBuilderTips(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
