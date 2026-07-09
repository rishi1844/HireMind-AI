// src/routes/usage.routes.js — Usage summary for frontend display (Phase 4.1)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { getUsageSummary } = require('../services/usageLimit.service');

/**
 * GET /api/usage/summary
 * Returns the user's current plan and monthly usage for all features.
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const summary = await getUsageSummary(req.user.email);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
