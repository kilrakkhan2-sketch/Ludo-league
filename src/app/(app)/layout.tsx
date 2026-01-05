
'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot }from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/AppHeader';
import { useBalance } from '@/hooks/useBalance';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { userProfile, setUserProfile } = useUser();
  const { balance, setBalance } = useBalance();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
        // If loading is finished and there's no user, redirect to login.
        // We allow access to certain pages like terms and privacy policy for all users.
        const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
        if (!allowedPaths.includes(pathname)) {
            router.push('/'); // Redirect to the main landing/login page
        }
    }
  }, [user, loading, pathname]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Only set up the listener if we have a user and firestore instance.
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserProfile({ uid: doc.id, ...data });
          // Let's assume the user document has a 'balance' field.
          if (typeof data.walletBalance === 'number') {
            setBalance(data.walletBalance);
          }
        } else {
          console.log("User document not found!");
        }
      }, (error) => {
        console.error("Error in user snapshot listener:", error);
      });
    }

    // Cleanup listener on component unmount or if user/firestore changes.
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, firestore, setUserProfile, setBalance]);

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-lg">Loading...</div>
        </div>
    );
  }

  if (!user) {
    // While redirecting, or for allowed paths, you might want to show a loader or nothing.
    // Or a generic landing page header if they are on an allowed path.
     const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
     if (allowedPaths.includes(pathname)) {
         return <>{children}</>; // Render policy pages without the full app layout
     }
    if (loading) return null; // Don't render anything while loading and no user
    return null; // Or a loading spinner while redirecting
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
        </main>
        <Toaster />
    </div>
  );
}
