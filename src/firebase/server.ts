import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';

let app: FirebaseApp;

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }
  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}
