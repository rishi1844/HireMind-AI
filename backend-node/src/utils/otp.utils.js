// src/utils/otp.utils.js — OTP generation helpers
const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP.
 * Mirrors AuthService.generateOtp()
 */
function generateOtp() {
  // Cryptographically secure random 6-digit number
  const min = 100000;
  const max = 999999;
  const range = max - min + 1;
  const bytes = crypto.randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return String(min + (value % range));
}

/**
 * Return a Date object N minutes from now.
 */
function expiresAt(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if a given expiry Date is still in the future.
 */
function isExpired(expiryDate) {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
}

module.exports = { generateOtp, expiresAt, isExpired };
