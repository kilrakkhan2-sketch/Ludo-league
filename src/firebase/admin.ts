import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('Missing required Firebase environment variable: FIREBASE_SERVICE_ACCOUNT_KEY');
}

let serviceAccount: ServiceAccount;

try {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');
  serviceAccount = JSON.parse(serviceAccountString);
} catch (e) {
  throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
}

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