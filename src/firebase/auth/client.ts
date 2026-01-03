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
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Get the auth instance
const auth = getAuth(getApp());
const firestore = getFirestore(getApp());

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });

  // Create user profile in Firestore
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
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Create user profile in Firestore if it doesn't exist
  const userProfileRef = doc(firestore, 'users', user.uid);
  await setDoc(userProfileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      walletBalance: 0,
      kycStatus: 'not_submitted',
  }, { merge: true });

  return user;
}


export async function signOut() {
  return firebaseSignOut(auth);
}
