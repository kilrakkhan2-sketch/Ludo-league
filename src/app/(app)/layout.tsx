
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/AppHeader';
import { useBalance } from '@/hooks/useBalance';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { setUserProfile } = useUser();
  const { setBalance } = useBalance();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for Firebase Auth to initialize
    }

    const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
    if (!user) {
      if (!allowedPaths.includes(pathname)) {
        router.push('/');
      } else {
        setIsDataLoading(false);
      }
      return;
    }

    // User is authenticated, proceed to fetch profile data
    setIsDataLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserProfile({ uid: doc.id, ...data });
        if (typeof data.walletBalance === 'number') {
          setBalance(data.walletBalance);
        }
      } else {
        console.log("User document not found!");
      }
      setIsDataLoading(false); // Data loading finished
    }, (error) => {
      console.error("Error in user snapshot listener:", error);
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, firestore, pathname, router, setUserProfile, setBalance]);

  const totalLoading = authLoading || isDataLoading;

  // For public pages accessible to non-logged-in users
  const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
  if (!user && allowedPaths.includes(pathname)) {
    return <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>;
  }

  if (totalLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your experience...</p>
      </div>
    );
  }

  if (!user) {
      // This case handles the brief moment during redirection.
      return (
         <div className="flex h-screen items-center justify-center bg-background">
            <p className="text-lg">Redirecting to login...</p>
         </div>
      )
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

