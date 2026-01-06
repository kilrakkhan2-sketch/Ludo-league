
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


type UserContextValue = {
  user: User | null;
  userProfile: UserProfile | null; 
  isAdmin: boolean;
  loading: boolean;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    if (!auth) {
        // Auth service might not be available on initial server render.
        // We will wait for the client-side effect to run.
        return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        // Set admin status from custom claim first for responsiveness
        setIsAdmin(tokenResult.claims.isAdmin === true);
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      setLoading(true);
      const userProfileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
          const profileData = doc.data() as UserProfile;
          setUserProfile({ uid: doc.id, ...profileData });
          // Overwrite admin status with the one from Firestore doc as the source of truth
          setIsAdmin(profileData.isAdmin === true);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false);
      });
      return () => unsubscribe();
    } else if (!user) {
        setLoading(false);
    }
  }, [user, firestore]);

  return (
    <UserContext.Provider value={{ user, userProfile, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
