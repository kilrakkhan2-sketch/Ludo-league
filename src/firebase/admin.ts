
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Check if the service account key is provided in environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error("The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for Firebase Admin SDK initialization.");
}

// Parse the service account key from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize the Firebase Admin SDK, but only if it hasn't been initialized already.
const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
      // Add your databaseURL here if you use Realtime Database
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  : getApps()[0];

// Export the initialized services
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { app as adminApp, adminAuth, adminDb };

/**
 * A utility function to initialize the Firebase Admin SDK.
 * This ensures that the SDK is initialized only once.
 * @returns The initialized Firebase Admin app.
 */
export const initializeFirebaseAdmin = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getApps()[0];
};
