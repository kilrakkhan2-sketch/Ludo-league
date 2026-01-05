
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import AppShell from '@/components/AppShell';
import CustomLoader from '@/components/CustomLoader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isAdmin } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    // Let the loading screen show while we wait for auth state
    if (authLoading) {
      setIsAuthenticating(true);
      return;
    }
    
    const isAuthPage = pathname === '/' || pathname === '/register';
    const isAdminPage = pathname.startsWith('/admin');

    // If loading is finished
    if (!user && !isAuthPage) {
        // Not logged in and not on an auth page, redirect to login.
        router.replace('/');
    } else if (user && isAuthPage) {
        // Logged in and on an auth page, redirect to dashboard.
        router.replace('/dashboard');
    } else if (user && isAdminPage && !isAdmin) {
        // Logged in, trying to access admin page, but is not an admin.
        router.replace('/dashboard');
    }
    else {
        // In all other valid cases, stop showing the loader.
        setIsAuthenticating(false);
    }
    
  }, [user, authLoading, router, pathname, isAdmin]);

  // While checking auth state, show the custom loader
  if (isAuthenticating) {
    return <CustomLoader />;
  }
  
  const isAuthPage = pathname === '/' || pathname === '/register';

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
