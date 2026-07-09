// src/controllers/interview.controller.js — Mirrors Spring InterviewController.java
const interviewService = require('../services/interview.service');
const deviceAnalyticsService = require('../services/deviceAnalytics.service');

async function generateQuestions(req, res, next) {
  try {
    const result = await interviewService.generateQuestions(req.body, req.user.email);
    await deviceAnalyticsService.logDeviceAction(req.user.email, req.device, 'start_interview', req.device.ipAddress, req.headers['user-agent']);
    res.json(result);
  } catch (err) { next(err); }
}

async function evaluateAnswer(req, res, next) {
  try {
    const result = await interviewService.evaluateAnswer(req.body, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function saveSession(req, res, next) {
  try {
    const result = await interviewService.saveSession(req.body, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function getSessionHistory(req, res, next) {
  try {
    const result = await interviewService.getSessionHistory(req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function getSession(req, res, next) {
  try {
    const result = await interviewService.getSessionById(req.params.sessionId, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteSession(req, res, next) {
  try {
    await interviewService.deleteSession(req.params.sessionId, req.user.email);
    res.status(204).end();
  } catch (err) { next(err); }
}

async function generateTargetedQuestions(req, res, next) {
  try {
    const result = await interviewService.generateTargetedQuestions(req.body, req.user.email);
    await deviceAnalyticsService.logDeviceAction(req.user.email, req.device, 'start_targeted_interview', req.device.ipAddress, req.headers['user-agent']);
    res.json(result);
  } catch (err) { next(err); }
}

async function evaluateTargetedAnswer(req, res, next) {
  try {
    const result = await interviewService.evaluateTargetedAnswer(req.body, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function evaluateTargetedSession(req, res, next) {
  try {
    const result = await interviewService.evaluateTargetedSession(req.body, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

const { AccessToken } = require('livekit-server-sdk');

async function getLiveKitToken(req, res, next) {
  try {
    const { roomName, participantName } = req.body;
    if (!roomName || !participantName) {
      return res.status(400).json({ message: "roomName and participantName are required." });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ message: "LiveKit credentials are not configured in backend environment." });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    const serverUrl = process.env.LIVEKIT_URL || "wss://your-livekit-url";

    res.json({ token, serverUrl });
  } catch (err) { next(err); }
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  saveSession,
  getSessionHistory,
  getSession,
  deleteSession,
  generateTargetedQuestions,
  evaluateTargetedAnswer,
  evaluateTargetedSession,
  getLiveKitToken,
};
