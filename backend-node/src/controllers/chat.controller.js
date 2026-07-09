// src/controllers/chat.controller.js — HireMind AI Chatbot Controller
const { processMessage } = require('../services/chat.service');
const logger = require('../utils/logger');

/**
 * POST /api/chatbot/message
 * Body: { message, mode, conversationHistory, userContext, modePayload }
 */
async function handleMessage(req, res) {
  try {
    const { message, mode, conversationHistory, userContext, modePayload } = req.body;

    // Basic validation
    if (!message && mode !== 'mock-interview' && mode !== 'outreach') {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (message && message.length > 5000) {
      return res.status(400).json({ message: 'Message is too long (max 5000 chars).' });
    }

    const result = await processMessage({
      message: message || '',
      mode: mode || 'chat',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      userContext: userContext || {},
      modePayload: modePayload || {},
      // req.user is set by authMiddleware — true if token is valid
      isAuthenticated: !!req.user,
    });

    return res.json({
      success: true,
      reply: result.reply,
      mode: result.mode,
      // action can come from preprocessor nav responses OR from LLM structured output
      action: result.action || null,
      matchScore: result.matchScore || null,
      interviewState: result.interviewState || null,
      evaluation: result.evaluation || null,
      classification: result.classification || null,
      matchedFaq: result.matchedFaq || null,
      openaiCalled: result.openaiCalled ?? false,
      tokensSaved: result.tokensSaved || 0,
    });
  } catch (err) {
    logger.error(`[ChatController] Error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message || 'AI Genixpay is temporarily unavailable. Please try again.',
    });
  }
}

module.exports = { handleMessage };
