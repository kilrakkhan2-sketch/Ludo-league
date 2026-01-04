
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        // Auth service might not be available on initial server render.
        // It will become available on the client.
        return;
    };
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        // Check both claims and Firestore profile for admin status
        const claimsIsAdmin = tokenResult.claims.isAdmin === true;
        // User profile check will be handled in the other useEffect
        setIsAdmin(claimsIsAdmin); 
      } else {
        setIsAdmin(false);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      setLoading(true);
      const userProfileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
          const profileData = doc.data();
          setUserProfile(profileData);
          // Also check for admin status from the firestore document
          if (profileData.isAdmin === true) {
            setIsAdmin(true);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
          setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
      if (!user) {
        setLoading(false);
      }
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
