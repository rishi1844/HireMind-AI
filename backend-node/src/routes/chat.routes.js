// src/routes/chat.routes.js — Chatbot API Routes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { handleMessage } = require('../controllers/chat.controller');
const { rateLimit } = require('express-rate-limit');

// Rate limit: 30 messages per minute per user
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { message: 'Too many messages. Please slow down.' },
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});

// POST /api/chatbot/message
router.post('/message', authMiddleware, chatLimiter, handleMessage);

module.exports = router;
