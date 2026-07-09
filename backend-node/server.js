// server.js — Entry point for Vita AI Node.js backend
require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { ensureAdminUser } = require('./src/utils/adminSeed');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Vita AI backend running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

  // Ensure admin user exists in DB (non-blocking)
  ensureAdminUser().catch((err) => logger.warn('[AdminSeed] Unexpected error: ' + err.message));
});
