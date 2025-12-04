'use client';

import { ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from './index';

const { app, auth, firestore } = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider value={{ app, auth, firestore }}>
      {children}
    </FirebaseProvider>
  );
}
