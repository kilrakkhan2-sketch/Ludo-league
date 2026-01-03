
// This file is meant to be used on the client-side
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp, type Firestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '../config';

function getFirebaseApp(): FirebaseApp {
    const apps = getApps();
    if (!apps.length) {
        // Initialize on the client if not already initialized
        return initializeApp(firebaseConfig);
    }
    return apps[0];
}

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

function getFirebaseFirestore(): Firestore {
    return getFirestore(getFirebaseApp());
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const auth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });

  // Create user profile in Firestore
  const firestore = getFirebaseFirestore();
  const userProfileRef = doc(firestore, 'users', user.uid);
  await setDoc(userProfileRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    photoURL: user.photoURL,
    walletBalance: 0,
    kycStatus: 'not_submitted',
    createdAt: serverTimestamp(),
  }, { merge: true });

  return user;
}


export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Create or update user profile in Firestore
  const firestore = getFirebaseFirestore();
  const userProfileRef = doc(firestore, 'users', user.uid);
  await setDoc(userProfileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      // Set initial values only if they don't exist by merging
      walletBalance: 0,
      kycStatus: 'not_submitted',
      createdAt: serverTimestamp(),
  }, { merge: true });

  return user;
}


export async function signOut() {
  const auth = getFirebaseAuth();
  return firebaseSignOut(auth);
}
