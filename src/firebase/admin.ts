
import * as admin from 'firebase-admin';

// Ensure that the service account credentials are set in the environment variables.
// In a local environment, this might be a path to a JSON file.
// In a deployed environment (like Vercel), these are set as environment variables.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : undefined;

let app: admin.app.App;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is idempotent.
 * 
 * @returns {admin.app.App} The initialized Firebase Admin app instance.
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount!),
      // Add your databaseURL here if you are using Realtime Database
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    app = admin.app();
  }
  return app;
}
