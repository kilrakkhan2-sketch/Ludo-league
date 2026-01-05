
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

type UserContextValue = {
  user: User | null;
  userProfile: any | null; // Replace 'any' with your UserProfile type
  isAdmin: boolean;
  loading: boolean;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
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
        setIsAdmin(tokenResult.claims.isAdmin === true);
        // Firestore profile will be loaded in the other effect, 
        // but we don't set loading to false until that is also checked.
      } else {
        // If there's no user, we are not loading anymore.
        setIsAdmin(false);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      // Now that we have a user, we start loading the profile.
      setLoading(true);
      const userProfileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
          const profileData = doc.data();
          setUserProfile(profileData);
          // Check for admin status from Firestore profile, potentially overriding the claim
          if (profileData.isAdmin === true) {
            setIsAdmin(true);
          }
        } else {
          setUserProfile(null);
        }
        // Once profile is fetched (or not found), we are done loading.
        setLoading(false);
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false); // Also stop loading on error.
      });
      return () => unsubscribe();
    } else if (!user) {
        // If there's no user, we're not loading user profile data.
        // The onAuthStateChanged effect handles the main loading state.
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
