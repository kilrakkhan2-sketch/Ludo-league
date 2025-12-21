
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

    let unsubscribeFirestore: Unsubscribe | undefined;

    const unsubscribeAuth = onIdTokenChanged(auth, (authUser) => {
      // If there's an existing firestore listener, unsubscribe from it first.
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }

      if (authUser) {
        setState(prevState => ({ ...prevState, user: authUser, loading: true }));
        
        const userDocRef = doc(firestore, 'users', authUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = { id: docSnapshot.id, ...docSnapshot.data() } as UserProfile;
            setState(prevState => ({ ...prevState, userData: profileData, loading: false }));
          } else {
            setState(prevState => ({ ...prevState, userData: null, loading: false }));
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setState(prevState => ({ ...prevState, userData: null, loading: false }));
        });

      } else {
        // User logged out, clear everything.
        setState({ user: null, userData: null, loading: false });
      }
    });

    // Cleanup both auth and potential firestore listeners on component unmount.
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [auth, firestore]);

  return state;
}
