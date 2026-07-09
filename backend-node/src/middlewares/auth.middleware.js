// src/middlewares/auth.middleware.js — JWT authentication filter
// Replaces Spring Security AuthTokenFilter.java
const { verifyToken } = require('../utils/jwt.utils');
const logger = require('../utils/logger');

/**
 * Verifies the Bearer JWT from the Authorization header.
 * On success: attaches req.user = { email } and calls next().
 * On failure: returns 401.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.slice(7); // strip "Bearer "
    const decoded = verifyToken(token);

    // decoded.sub contains the email (set during token generation)
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = { email: decoded.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn(`[AUTH] Expired JWT: ${err.message}`);
      return res.status(401).json({ message: 'JWT token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      logger.warn(`[AUTH] Invalid JWT: ${err.message}`);
      return res.status(401).json({ message: 'Invalid JWT token' });
    }
    logger.error(`[AUTH] Unexpected auth error: ${err.message}`);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = authMiddleware;
