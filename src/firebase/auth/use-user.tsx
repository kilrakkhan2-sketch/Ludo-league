
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
        setIsAdmin(tokenResult.claims.isAdmin === true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      const userProfileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        } else {
          setUserProfile(null);
        }
      }, (error) => {
          console.error("Error listening to user profile:", error);
          setUserProfile(null);
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
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
