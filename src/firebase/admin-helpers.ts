
// This file is intended to be used in Server Components for read-only operations.
// It uses a separate initialization to avoid conflicts with the client-side Firebase app.
// DO NOT use this for write operations from the client.

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// We give it a unique name to avoid conflicts with the default client app
const SERVER_APP_NAME = 'firebase-server-app';

let app: FirebaseApp;
let firestore: Firestore;

// This function is idempotent.
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
} {
  if (getApps().some(app => app.name === SERVER_APP_NAME)) {
    app = getApp(SERVER_APP_NAME);
    firestore = getFirestore(app);
  } else {
    app = initializeApp(firebaseConfig, SERVER_APP_NAME);
    firestore = getFirestore(app);
  }

  return { app, firestore };
}
