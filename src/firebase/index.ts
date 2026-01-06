
import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';

import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, useMessaging } from './provider';
import { FirebaseClientProvider } from './client-provider';


function initializeFirebase(config: FirebaseOptions): { app: FirebaseApp; auth: Auth; firestore: Firestore; messaging: Messaging | null } {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  
  let messaging: Messaging | null = null;
  // Messaging is only available in the browser
  if (typeof window !== 'undefined') {
    try {
        messaging = getMessaging(app);
    } catch(e) {
        console.error("Could not initialize Firebase Messaging", e);
    }
  }

  return { app, auth, firestore, messaging };
}

const { app, auth, firestore: db, messaging } = initializeFirebase(firebaseConfig);

// export the useUser hook
export { useUser };
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, FirebaseClientProvider, useMessaging };
export { initializeFirebase, db, messaging };
