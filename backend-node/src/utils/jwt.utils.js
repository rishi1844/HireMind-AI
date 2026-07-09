// src/utils/jwt.utils.js — JWT generation and verification (replaces JwtUtils.java)
const jwt = require('jsonwebtoken');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

const getExpirationMs = () => {
  return parseInt(process.env.JWT_EXPIRATION_MS || '86400000', 10);
};

/**
 * Generate a JWT token for the given email (subject).
 * Mirrors JwtUtils.generateTokenFromEmail()
 */
function generateToken(email) {
  const expiresIn = Math.floor(getExpirationMs() / 1000); // convert ms to seconds
  return jwt.sign({ sub: email }, getSecret(), { expiresIn });
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws an error if invalid or expired.
 * Mirrors JwtUtils.validateJwtToken() + getEmailFromJwtToken()
 */
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

/**
 * Extract the email from a JWT without verifying (for logging etc.)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = { generateToken, verifyToken, decodeToken };
