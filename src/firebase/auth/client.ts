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
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp, type Firestore, getDocs, query, where, collection, limit } from 'firebase/firestore';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '../config';

export function getFirebaseApp(): FirebaseApp {
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

const generateReferralCode = (name: string) => {
    const namePart = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${namePart}${randomPart}`;
};


export async function signUpWithEmail(email: string, password: string, displayName: string, referralCode?: string) {
  const auth = getFirebaseAuth();
  const firestore = getFirebaseFirestore();
  let referredBy = '';
  
  if (referralCode) {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        referredBy = querySnapshot.docs[0].id;
    } else {
        throw new Error('Invalid referral code.');
    }
  }

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
    createdAt: serverTimestamp(),
    referralCode: generateReferralCode(displayName),
    referredBy: referredBy,
    isAdmin: false, // Ensure isAdmin is set on creation
    rank: 0, // Beginner rank
    maxUnlockedAmount: 100, // Max amount for beginners
    winnings: 0,
    totalMatchesPlayed: 0,
    totalMatchesWon: 0,
    winRate: 0,
    dailyLoss: 0,
    lossStreak: 0,
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
      referralCode: generateReferralCode(user.displayName || 'user'),
      isAdmin: false,
      rank: 0,
      maxUnlockedAmount: 100,
      winnings: 0,
      totalMatchesPlayed: 0,
      totalMatchesWon: 0,
      winRate: 0,
      dailyLoss: 0,
      lossStreak: 0,
  }, { merge: true });

  return user;
}

export async function sendPasswordReset(email: string) {
  const auth = getFirebaseAuth();
  return sendPasswordResetEmail(auth, email);
}


export async function signOut() {
  const auth = getFirebaseAuth();
  return firebaseSignOut(auth);
}

    