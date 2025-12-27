import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('Missing required Firebase environment variable: FIREBASE_SERVICE_ACCOUNT_KEY');
}

let serviceAccount: ServiceAccount;

try {
  let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // It looks like the string is wrapped in single quotes, let's remove them
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.substring(1, key.length - 1);
  }

  const serviceAccountString = key.replace(/\\n/g, '\n');
  serviceAccount = JSON.parse(serviceAccountString);
} catch (e) {
  console.error(e);
  throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
}

// Initialize the Firebase Admin SDK
const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };

export const initializeFirebaseAdmin = () => {
  return app;
};