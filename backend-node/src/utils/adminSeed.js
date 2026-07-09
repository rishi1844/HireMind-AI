// src/utils/adminSeed.js — Ensures admin user exists in the AdminUser table at startup
// The DB has a separate admin_users table (AdminUser model) for admin credentials.
// Regular users (User model) have NO role column — admin auth is completely separate.
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const logger = require('../utils/logger');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'vita@genixpay.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Vita2026';

/**
 * Ensure the admin user exists in the admin_users table.
 * Creates it with bcrypt-hashed password if missing.
 * Updates password hash if it already exists (so .env changes take effect).
 * Called once at server startup — non-blocking.
 */
async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const existing = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      // Update password hash so .env changes always propagate
      await prisma.adminUser.update({
        where: { email: ADMIN_EMAIL },
        data: { passwordHash: hashedPassword },
      });
      logger.info(`[AdminSeed] Admin verified in admin_users: ${ADMIN_EMAIL}`);
    } else {
      await prisma.adminUser.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'Vita Admin',
          passwordHash: hashedPassword,
        },
      });
      logger.info(`[AdminSeed] Admin created in admin_users: ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    logger.warn(`[AdminSeed] Could not ensure admin user: ${err.message}`);
  }
}

module.exports = { ensureAdminUser };
