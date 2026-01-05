
import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';


function initializeFirebase(config: FirebaseOptions): { app: FirebaseApp; auth: Auth; firestore: Firestore } {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

const { app, auth, firestore: db } = initializeFirebase(firebaseConfig);

// export the useUser hook
export { useUser };
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, FirebaseClientProvider };
export { initializeFirebase, db };
