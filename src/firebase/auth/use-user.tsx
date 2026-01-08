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
import { Loader2 } from 'lucide-react';

// A simple full-screen loader component to prevent rendering the app in an inconsistent state.
const FullScreenLoader = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading App...</p>
        </div>
    </div>
);

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
    if (!auth || !firestore) {
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // If a user is authenticated, listen to their profile document.
        const userProfileRef = doc(firestore, 'users', authUser.uid);
        
        const unsubscribeProfile = onSnapshot(userProfileRef, 
          async (profileDoc) => {
            const tokenResult = await authUser.getIdTokenResult();
            const isAdminClaim = tokenResult.claims.isAdmin === true;

            if (profileDoc.exists()) {
              const profileData = profileDoc.data() as UserProfile;
              setUser(authUser);
              setUserProfile({ uid: profileDoc.id, ...profileData });
              // Firestore doc is the source of truth for admin status
              setIsAdmin(profileData.isAdmin ?? isAdminClaim);
            } else {
              // Authenticated user with no profile doc in Firestore.
              setUser(authUser);
              setUserProfile(null);
              setIsAdmin(isAdminClaim);
            }
            setLoading(false); // Stop loading once user and profile are processed.
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            setUser(authUser);
            setUserProfile(null);
            setIsAdmin(false);
            setLoading(false); // Stop loading even on error to prevent getting stuck.
          }
        );
        
        return () => unsubscribeProfile();

      } else {
        // No user is authenticated.
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false); // Stop loading, app will show public/login state.
      }
    });

    return () => unsubscribeAuth();

  }, [auth, firestore]);

  // While the initial auth check is running, show a full-screen loader.
  if (loading) {
    return <FullScreenLoader />;
  }
  
  // Once loaded, render the app.
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
