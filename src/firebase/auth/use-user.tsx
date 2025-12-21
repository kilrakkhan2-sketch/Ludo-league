'use client';

import { useEffect, useState, useMemo } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { UserProfile } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
}

export function useUser(): AuthState {
  const auth = useAuth();
  const firestore = useFirestore();

  const [state, setState] = useState<AuthState>({
    user: auth?.currentUser || null,
    userData: null,
    loading: true,
  });

  const user = state.user;

  useEffect(() => {
    if (!auth) {
        setState({ user: null, userData: null, loading: false });
        return;
    }
    const unsubscribeAuth = onIdTokenChanged(auth, (authUser) => {
       if (authUser) {
         setState(prevState => ({ ...prevState, user: authUser, loading: !prevState.userData }));
       } else {
         setState({ user: null, userData: null, loading: false });
       }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const profileData = { id: doc.id, ...doc.data() } as UserProfile;
            setState(prevState => ({ ...prevState, userData: profileData, loading: false }));
        } else {
             // This case might happen if the user exists in Auth but not in Firestore.
             // We set loading to false to prevent an infinite loading state.
             setState(prevState => ({ ...prevState, userData: null, loading: false }));
        }
      }, (error) => {
          console.error("Error fetching user profile:", error);
          setState(prevState => ({ ...prevState, userData: null, loading: false }));
      });

      return () => unsubscribeFirestore();
    } else if (!user) {
        // If there's no user, we are not loading.
        setState(prevState => ({...prevState, loading: false}));
    }
  }, [user, firestore]);

  return state;
}
