// src/routes/auth.routes.js — All /api/auth/* routes (mirrors Spring AuthController)
const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);          // Phase 2.3: JWT refresh
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/social-login', authController.socialLogin);
router.get('/health', authController.health);


// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;
