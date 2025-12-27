
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

  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: Unsubscribe | undefined;

    const authUnsubscribe = onIdTokenChanged(auth, (authUser) => {
      // If there's an existing profile listener, unsubscribe from it
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }
      
      setUser(authUser); // Update the user state immediately

      if (authUser) {
        // If user is logged in, listen to their profile document
        const userDocRef = doc(firestore, 'users', authUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData({ id: docSnapshot.id, ...docSnapshot.data() } as UserProfile);
          } else {
            setUserData(null);
          }
          setLoading(false); // Stop loading once profile is fetched (or not found)
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserData(null);
          setLoading(false);
        });
      } else {
        // If user is logged out, clear profile data and stop loading
        setUserData(null);
        setLoading(false);
      }
    });

    // Cleanup function to unsubscribe from listeners when the component unmounts
    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, [auth, firestore]);

  return { user, userData, loading };
}

    