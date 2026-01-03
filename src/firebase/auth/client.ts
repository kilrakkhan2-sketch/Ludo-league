
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
import { doc, setDoc, getFirestore, type Firestore } from 'firebase/firestore';
import { getApp, getApps, type FirebaseApp } from 'firebase/app';

function getFirebaseApp(): FirebaseApp {
    const apps = getApps();
    if (!apps.length) {
        throw new Error("Firebase has not been initialized. Please ensure FirebaseProvider is set up correctly.");
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

  // Create user profile in Firestore if it doesn't exist
  const firestore = getFirebaseFirestore();
  const userProfileRef = doc(firestore, 'users', user.uid);
  // Use setDoc with merge:true to create or update, preventing overwrites of existing data
  await setDoc(userProfileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
  }, { merge: true });

  // Now, check if some fields are missing and set initial values only if they don't exist.
  // This is a bit more complex and might be better handled in a transaction or a cloud function
  // For client-side, a simple merge on initial creation is often sufficient.
  // Let's refine the above setDoc to be more robust.
  
  await setDoc(userProfileRef, {
      walletBalance: 0,
      kycStatus: 'not_submitted',
  }, { merge: true });


  return user;
}


export async function signOut() {
  const auth = getFirebaseAuth();
  return firebaseSignOut(auth);
}
