
// This file is intended to be used in Server Components for read-only operations.
// It uses the Firebase Admin SDK to securely access Firestore from the server.
// DO NOT use this for write operations from the client.

import { initializeFirebaseAdmin } from '@/firebase/admin';
import * as admin from 'firebase-admin';

// We give it a unique name to avoid conflicts with the default client app
const SERVER_APP_NAME = 'firebase-server-app';

let app: admin.app.App;
let firestore: admin.firestore.Firestore;

// This function is idempotent.
export function initializeFirebase(): {
  app: admin.app.App;
  firestore: admin.firestore.Firestore;
} {
  app = initializeFirebaseAdmin();
  firestore = admin.firestore(app);

  return { app, firestore };
}
