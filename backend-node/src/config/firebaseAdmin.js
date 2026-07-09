// src/config/firebaseAdmin.js — Firebase Admin SDK (server-side token verification)
const admin = require('firebase-admin');
const logger = require('../utils/logger');

let adminApp = null;

function getAdminApp() {
  if (adminApp) return adminApp;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  adminApp = admin.initializeApp(
    { credential: admin.credential.cert(serviceAccount) },
    'vita-firebase-admin'
  );

  logger.info('[Firebase Admin] Initialized successfully.');
  return adminApp;
}

async function verifyFirebaseIdToken(idToken) {
  const app = getAdminApp();
  return admin.auth(app).verifyIdToken(idToken);
}

module.exports = { verifyFirebaseIdToken };
