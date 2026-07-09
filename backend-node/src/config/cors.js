// src/config/cors.js — CORS configuration
const cors = require('cors');
const logger = require('../utils/logger');

// Support comma-separated list of allowed origins via FRONTEND_URL env var
const allowedOrigins = (process.env.FRONTEND_URL || 'https://vita.genixpay.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

logger.info('[CORS] Allowed origins: ' + allowedOrigins.join(', '));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Return a structured error — caught by the global error handler → 403
      const err = new Error(`CORS: origin '${origin}' not allowed`);
      err.status = 403;
      logger.warn('[CORS] Blocked origin: ' + origin + ' | Allowed: ' + allowedOrigins.join(', '));
      callback(err);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

module.exports = cors(corsOptions);
