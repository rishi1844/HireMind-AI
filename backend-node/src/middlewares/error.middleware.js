// src/middlewares/error.middleware.js — Global error handler
// Replaces Spring's @GlobalExceptionHandler
const logger = require('../utils/logger');

/**
 * Maps error types/messages to HTTP status codes.
 */
function resolveStatus(err) {
  if (err.status) return err.status;
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('not found')) return 404;
  if (msg.includes('unauthorized') || msg.includes('invalid token') || msg.includes('expired')) return 401;
  if (msg.includes('forbidden') || msg.includes('access denied')) return 403;
  if (msg.includes('already exists') || msg.includes('already in use')) return 409;
  if (err.name === 'ZodError') return 422;
  if (msg.includes('validation') || msg.includes('required') || msg.includes('invalid')) return 400;

  return 500;
}

/**
 * Express 4-argument error handler — must be registered LAST.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = resolveStatus(err);

  // Zod validation errors → user-friendly messages
  if (err.name === 'ZodError') {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    logger.warn(`[VALIDATION] ${req.method} ${req.originalUrl} → ${messages.join('; ')}`);
    return res.status(422).json({ message: messages[0], errors: messages });
  }

  if (status >= 500) {
    logger.error(`[ERROR] ${req.method} ${req.originalUrl} → ${err.message}`, err);
  } else {
    logger.warn(`[WARN] ${req.method} ${req.originalUrl} → ${status}: ${err.message}`);
  }

  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorMiddleware;
