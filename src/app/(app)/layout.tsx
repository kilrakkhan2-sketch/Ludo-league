
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import AppShell from '@/components/AppShell';
import CustomLoader from '@/components/CustomLoader'; // Import the new loader

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, error } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    // If loading is finished
    if (!authLoading) {
      // If there is no user and we are not on an auth page, redirect to login
      if (!user && !isAuthPage) {
        router.replace('/login');
      } 
      // If there IS a user and we ARE on an auth page, redirect to dashboard
      else if (user && isAuthPage) {
        router.replace('/dashboard');
      } 
      // Otherwise, authentication is complete
      else {
        setIsAuthenticating(false);
      }
    } 
    // Also handle error state
    if (error && !isAuthPage) {
        router.replace('/login');
    }

  }, [user, authLoading, error, router, pathname]);

  // While checking auth state, show the custom loader
  if (isAuthenticating) {
    return <CustomLoader />;
  }

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // For login/signup pages, don't use the AppShell
  if (isAuthPage) {
    return (
        <Suspense fallback={<CustomLoader/>}>
            {children}
        </Suspense>
    );
  }

  // For all other app pages, wrap them in the AppShell
  return (
    <AppShell>
        <Suspense fallback={<CustomLoader/>}>
            {children}
        </Suspense>
    </AppShell>
  );
}
