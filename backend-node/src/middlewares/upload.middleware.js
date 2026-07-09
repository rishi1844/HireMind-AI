// src/middlewares/upload.middleware.js — Multer config (replaces Spring MultipartFile)
const multer = require('multer');

const MAX_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;

/**
 * In-memory storage — file bytes available via req.file.buffer
 * Used for resume PDF upload and profile image upload.
 */
const memoryStorage = multer.memoryStorage();

/** Resume PDF upload — single file, field name = "file" */
const resumeUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload'), false);
    }
  },
}).single('file');

/** Profile image upload — single file, field name = "file" */
const profileImageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  },
}).single('file');

/** Resume builder resume upload for auto-fill — PDF or images (JPG, PNG) up to 5MB */
const builderResumeUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed for resume import'), false);
    }
  },
}).single('file');

/**
 * Wraps multer middleware to convert its callback errors into Express errors.
 */
function wrapMulter(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        err.status = 400;
        return next(err);
      }
      next();
    });
  };
}

module.exports = {
  resumeUpload: wrapMulter(resumeUpload),
  profileImageUpload: wrapMulter(profileImageUpload),
  builderResumeUpload: wrapMulter(builderResumeUpload),
};
