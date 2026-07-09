// src/controllers/auth.controller.js — Thin controller layer (mirrors AuthController.java)
const authService = require('../services/auth.service');
const deviceAnalyticsService = require('../services/deviceAnalytics.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    if (result && result.email) {
      await deviceAnalyticsService.logDeviceAction(result.email, req.device, 'signup', req.device.ipAddress, req.headers['user-agent']);
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    if (result && result.email) {
      await deviceAnalyticsService.logDeviceAction(result.email, req.device, 'login', req.device.ipAddress, req.headers['user-agent']);
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyOtp(req.body);
    if (result && result.email) {
      await deviceAnalyticsService.logDeviceAction(result.email, req.device, 'login', req.device.ipAddress, req.headers['user-agent']);
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function resendOtp(req, res, next) {
  try {
    const result = await authService.resendOtp(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function socialLogin(req, res, next) {
  try {
    const result = await authService.socialLogin(req.body);
    if (result && result.email) {
      await deviceAnalyticsService.logDeviceAction(result.email, req.device, 'login', req.device.ipAddress, req.headers['user-agent']);
    }
    res.json(result);
  } catch (err) { next(err); }
}

async function getCurrentUser(req, res, next) {
  try {
    const result = await authService.getCurrentUser(req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(req.user.email, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

function health(_req, res) {
  res.json({ status: 'ok' });
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.email, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    const result = await authService.deleteAccount(req.user.email, req.body.password);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword, socialLogin, getCurrentUser, updateProfile, health, refresh, changePassword, deleteAccount };

