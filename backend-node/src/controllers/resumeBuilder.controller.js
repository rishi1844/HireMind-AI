// src/controllers/resumeBuilder.controller.js — Mirrors Spring ResumeBuilderController.java
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const resumeBuilderService = require('../services/resumeBuilder.service');
const resumeExportService = require('../services/resumeExport.service');
const resumeEmailService = require('../services/resumeEmail.service');
const resumePuppeteerService = require('../services/resumePuppeteer.service');
const { sanitizeFilename } = require('../utils/sanitize.utils');
const usageLimitService = require('../services/usageLimit.service');
const deviceAnalyticsService = require('../services/deviceAnalytics.service');
const { preparePaymentPayload } = require('../utils/deviceDetector');

async function create(req, res, next) {
  try {
    const result = await resumeBuilderService.createResume(req.body, req.user.email);
    await deviceAnalyticsService.logDeviceAction(req.user.email, req.device, 'use_builder', req.device.ipAddress, req.headers['user-agent']);
    res.json(result);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const result = await resumeBuilderService.updateResume(req.params.id, req.body, req.user.email);
    await deviceAnalyticsService.logDeviceAction(req.user.email, req.device, 'use_builder', req.device.ipAddress, req.headers['user-agent']);
    res.json(result);
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const result = await resumeBuilderService.getAllResumes(req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const result = await resumeBuilderService.getById(req.params.id, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteResume(req, res, next) {
  try {
    await resumeBuilderService.deleteById(req.params.id, req.user.email);
    res.json({ message: 'Resume deleted successfully' });
  } catch (err) { next(err); }
}

async function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No image file uploaded. Field name must be "file".');
      err.status = 400;
      return next(err);
    }
    const result = await resumeBuilderService.uploadProfileImage(
      req.file.buffer,
      req.file.mimetype,
      req.user.email
    );
    res.json(result);
  } catch (err) { next(err); }
}

async function generateField(req, res, next) {
  try {
    const result = await resumeBuilderService.generateField(req.body, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
}

async function exportPdf(req, res, next) {
  try {
    await usageLimitService.checkAndRecordDownload(req.user.email);
    const builtResume = await resumeBuilderService.getRawById(req.params.id, req.user.email);
    const pdfBytes = await resumeExportService.exportToPdf(builtResume);
    const filename = sanitizeFilename(builtResume.title) + '.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBytes.length,
    });
    res.send(pdfBytes);
  } catch (err) { next(err); }
}

async function exportDocx(req, res, next) {
  try {
    await usageLimitService.checkAndRecordDownload(req.user.email);
    const builtResume = await resumeBuilderService.getRawById(req.params.id, req.user.email);
    // Allow caller to override the stored templateId (e.g. user changed template but hasn't saved yet)
    if (req.query.templateId) {
      builtResume.templateId = req.query.templateId;
    }
    const docxBytes = await resumeExportService.exportToDocx(builtResume);
    const filename = sanitizeFilename(builtResume.title) + '.docx';

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': docxBytes.length,
    });
    res.send(docxBytes);
  } catch (err) { next(err); }
}

async function createPrintToken(req, res, next) {
  try {
    const builtResume = await resumeBuilderService.getRawById(req.params.id, req.user.email);
    const token = jwt.sign(
      {
        resumeId: builtResume.id.toString(),
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '5m' }
    );
    res.json({ token });
  } catch (err) { next(err); }
}

async function validatePrintToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      const err = new Error('Token is required');
      err.status = 400;
      return next(err);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Fetch resume from DB to avoid huge JWT token payload in URL
    const builtResume = await prisma.builtResume.findUnique({
      where: { id: BigInt(decoded.resumeId) }
    });

    if (!builtResume) {
      const err = new Error('Resume not found');
      err.status = 404;
      return next(err);
    }

    const parsedResumeData = builtResume.resumeData ? JSON.parse(builtResume.resumeData) : {};

    res.json({
      resumeId: builtResume.id.toString(),
      templateId: builtResume.templateId,
      theme: parsedResumeData._theme || null,
      resumeData: parsedResumeData,
    });
  } catch (err) {
    const error = new Error('Invalid or expired print token');
    error.status = 401;
    next(error);
  }
}

async function sendEmail(req, res, next) {
  try {
    await usageLimitService.checkAndRecordDownload(req.user.email);
    const builtResume = await resumeBuilderService.getRawById(req.params.id, req.user.email);
    const { recipientEmail, format, templateId } = req.body;
    if (!recipientEmail) {
      const err = new Error('recipientEmail is required');
      err.status = 400;
      return next(err);
    }
    if (templateId) {
      builtResume.templateId = templateId;
    }

    if ((format || 'PDF').toUpperCase() === 'DOCX') {
      await resumeEmailService.sendResume(builtResume, recipientEmail, 'DOCX');
    } else {
      // Sign short-lived token for Puppeteer (only containing resumeId to prevent URL size limits)
      const token = jwt.sign(
        {
          resumeId: builtResume.id.toString(),
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '5m' }
      );

      const pdfBuffer = await resumePuppeteerService.generatePdfBuffer(builtResume.id.toString(), token);
      await resumeEmailService.sendResumeBuffer(pdfBuffer, builtResume.title, recipientEmail);
    }

    res.json({ message: `Resume sent to ${recipientEmail}` });
  } catch (err) { next(err); }
}

async function extractResume(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded. Field name must be "file".');
      err.status = 400;
      return next(err);
    }

    let userId = null;
    try {
      const user = await prisma.user.findUnique({ where: { email: req.user.email } });
      if (user) userId = user.id.toString();
    } catch (err) {
      // ignore user fetch error and proceed with null
    }

    const result = await resumeBuilderService.extractResumeData(
      req.file.buffer,
      req.file.mimetype,
      userId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function trackDownload(req, res, next) {
  try {
    await usageLimitService.checkAndRecordDownload(req.user.email);
    res.json({ success: true, message: 'Download tracked successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  update,
  getAll,
  getById,
  deleteResume,
  uploadProfileImage,
  generateField,
  exportPdf,
  exportDocx,
  createPrintToken,
  validatePrintToken,
  sendEmail,
  extractResume,
  trackDownload,
};

