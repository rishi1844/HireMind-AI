// src/routes/admin.routes.js
const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');

const router = Router();

// Public: admin login and forgot password flow (no auth needed)
router.post('/login', adminController.login);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/verify-otp', adminController.verifyOtp);
router.post('/reset-password', adminController.resetPassword);

// Protected: all other admin routes require admin JWT
router.use(adminAuth);

router.get('/stats',                adminController.getStats);
router.get('/users',                adminController.getUsers);
router.get('/users/:id',            adminController.getUserDetail);
router.get('/token-usage',          adminController.getTokenUsage);
router.patch('/users/:id/plan',     adminController.updateUserPlan);
router.delete('/users/:id',         adminController.deleteUser);

module.exports = router;
