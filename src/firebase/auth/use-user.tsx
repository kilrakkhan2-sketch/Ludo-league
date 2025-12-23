
'use client';

import { useEffect, useState, useCallback } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { UserProfile } from '@/types';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
}

export function useUser(): AuthState {
  const auth = useAuth();
  const firestore = useFirestore();

  const [state, setState] = useState<AuthState>(() => ({
    user: auth?.currentUser || null,
    userData: null,
    loading: true,
  }));

  const updateUserAndClaims = useCallback(async (authUser: User | null) => {
    if (!auth || !firestore) {
      setState({ user: null, userData: null, loading: false });
      return () => {};
    }

    if (!authUser) {
      setState({ user: null, userData: null, loading: false });
      return () => {};
    }
    
    // Get fresh token to ensure custom claims are up to date
    await authUser.getIdToken(true);

    const userDocRef = doc(firestore, 'users', authUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (docSnapshot) => {
      const profileData = docSnapshot.exists()
        ? { id: docSnapshot.id, ...docSnapshot.data() } as UserProfile
        : null;
        
      setState({ user: authUser, userData: profileData, loading: false });
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setState({ user: authUser, userData: null, loading: false });
    });

    return unsubscribeFirestore;
  }, [auth, firestore]);

  useEffect(() => {
    if (!auth) {
        setState({ user: null, userData: null, loading: false });
        return;
    }

    let unsubscribeFirestore: Unsubscribe | undefined;

    const unsubscribeAuth = onIdTokenChanged(auth, async (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      setState(prevState => ({ ...prevState, loading: true }));
      unsubscribeFirestore = await updateUserAndClaims(authUser) as Unsubscribe;
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [auth, updateUserAndClaims]);

  return state;
}
