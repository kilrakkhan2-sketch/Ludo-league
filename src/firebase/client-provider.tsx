'use client';

import { ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Initialize Firebase
const { app, auth, firestore, storage } = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: ReactNode }) {

  return (
    <FirebaseProvider value={{ app, auth, firestore, storage }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseProvider>
  );
}
