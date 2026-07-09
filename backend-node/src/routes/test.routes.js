// src/routes/test.routes.js — Test API routes
const express = require('express');
const router = express.Router();

/**
 * GET /test/numbers
 * Returns an array of numbers from 1 to 10
 */
router.get('/numbers', (_req, res) => {
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, ..., 10]
  res.json({
    success: true,
    data: numbers,
    message: 'Array of numbers from 1 to 10',
  });
});

module.exports = router;
