'use client';

import { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FirebaseContextValue;
}) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const { app } = useFirebase();
  if (!app) {
    throw new Error('Firebase app not available. Did you forget to wrap your component in FirebaseProvider?');
  }
  return app;
}

export function useAuth() {
  const { auth } = useFirebase();
   if (!auth) {
    throw new Error('Firebase Auth not available. Did you forget to wrap your component in FirebaseProvider?');
  }
  return auth;
}

export function useFirestore() {
  const { firestore } = useFirebase();
   if (!firestore) {
    throw new Error('Firestore not available. Did you forget to wrap your component in FirebaseProvider?');
  }
  return firestore;
}
