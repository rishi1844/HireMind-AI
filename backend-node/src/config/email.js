// src/config/email.js — Nodemailer transporter (replaces Spring JavaMailSender)
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailEnabled = process.env.MAIL_ENABLED === 'true';
  if (!mailEnabled) {
    logger.warn('[EMAIL] MAIL_ENABLED=false — emails will be logged to console only');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: false, // STARTTLS on port 587
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // avoids TLS cert issues on some hosts
    },
    pool: true,          // reuse connections
    maxConnections: 5,
    rateDelta: 1000,     // send max 5 emails per second
    rateLimit: 5,
  });

  logger.info(`[EMAIL] Nodemailer configured → ${process.env.MAIL_HOST}:${process.env.MAIL_PORT}`);
  return transporter;
}

module.exports = { getTransporter };
