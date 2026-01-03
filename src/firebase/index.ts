import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';


function initializeFirebase(config: FirebaseOptions) {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    // Important: Re-route emulator traffic to the correct host
    // for server-side rendering and client-side rendering.
    // by default the host is localhost, but in a cloud workstation
    // it needs to be re-routed.
    try {
        connectFirestoreEmulator(firestore, host, 8080);
        connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    } catch (e) {
        // ignore errors
    }
  }

  return { app, auth, firestore };
}

// export the useUser hook
export { useUser };
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, FirebaseClientProvider };
export { initializeFirebase };
