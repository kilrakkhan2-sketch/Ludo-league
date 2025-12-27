
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Re-export providers and core hooks from the provider file
export * from './provider';

// Re-export feature-specific hooks
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useCollectionGroup } from './firestore/use-collection-group';

/**
 * Initializes Firebase and returns the singleton instances of the services.
 * This function ensures that Firebase is initialized only once.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  let auth: Auth;
  let firestore: Firestore;
  let functions: Functions;
  let storage: FirebaseStorage;

  if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
  } else {
      app = getApps()[0];
  }
  
  auth = getAuth(app);
  firestore = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app);

  return { app, auth, firestore, functions, storage };
}
