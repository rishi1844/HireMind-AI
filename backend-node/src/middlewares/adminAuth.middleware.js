// src/middlewares/adminAuth.middleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_fallback_secret';

/**
 * Middleware: validates admin JWT token.
 * Admin tokens are issued by POST /api/admin/login.
 */
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication required.' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!payload.isAdmin) {
      return res.status(403).json({ message: 'Access denied: not an admin.' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    logger.warn(`Admin auth failed: ${err.message}`);
    return res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
}

module.exports = adminAuthMiddleware;
