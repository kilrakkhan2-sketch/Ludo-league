
'use client';

import { ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from './index';

// Initialize Firebase using the singleton pattern
const { app, auth, firestore, storage, functions } = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider value={{ app, auth, firestore, storage, functions }}>
      {children}
    </FirebaseProvider>
  );
}
