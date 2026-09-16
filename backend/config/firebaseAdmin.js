const admin = require('firebase-admin');

// We'll use environment variables for the service account details
// to avoid hardcoding sensitive information.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key needs to handle newline characters correctly from env
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
};

if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[FIREBASE] Admin SDK initialized successfully');
  } catch (error) {
    console.error('[FIREBASE] Admin SDK initialization failed:', error.message);
  }
} else {
  console.warn('[FIREBASE] Admin SDK credentials missing. Auth middleware will fail.');
}

module.exports = admin;
