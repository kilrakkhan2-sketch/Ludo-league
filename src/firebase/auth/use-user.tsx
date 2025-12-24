'use client';

import { useEffect, useState } from 'react';
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

  const [state, setState] = useState<AuthState>({
    user: auth?.currentUser || null,
    userData: null,
    loading: true,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setState({ user: null, userData: null, loading: false });
      return;
    }

    let firestoreUnsubscribe: Unsubscribe | undefined;

    const authUnsubscribe = onIdTokenChanged(auth, async (authUser) => {
      // First, cancel any existing Firestore listener
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }

      if (authUser) {
        // If there's a user, set loading and get their profile
        setState((prevState) => ({ ...prevState, user: authUser, loading: true }));
        
        await authUser.getIdToken(true); // Refresh token for custom claims
        
        const userDocRef = doc(firestore, 'users', authUser.uid);

        firestoreUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          const profileData = docSnapshot.exists()
            ? ({ id: docSnapshot.id, ...docSnapshot.data() } as UserProfile)
            : null;
          setState({ user: authUser, userData: profileData, loading: false });
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setState({ user: authUser, userData: null, loading: false });
        });
        
      } else {
        // If there's no user, set state to not loading and clear data
        setState({ user: null, userData: null, loading: false });
      }
    });

    // Cleanup function
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
    // Dependencies are the core Firebase services.
  }, [auth, firestore]);

  return state;
}