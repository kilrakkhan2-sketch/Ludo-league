
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

  useEffect(() => {
    // While auth state is loading, don't do any redirects
    if (authLoading) {
      return;
    }
    
    const isAuthPage = pathname === '/' || pathname === '/register';
    const isAdminPage = pathname.startsWith('/admin');

    // If loading is finished and there is no user
    if (!user) {
        // If not on an auth page, redirect to login.
        if(!isAuthPage) {
            router.replace('/');
        }
    } else { // If user exists
        // If on an auth page, redirect to dashboard.
        if (isAuthPage) {
            router.replace('/dashboard');
        }
        // If trying to access admin page, but is not an admin, redirect.
        else if (isAdminPage && !isAdmin) {
            router.replace('/dashboard');
        }
    }
    
  }, [user, authLoading, router, pathname, isAdmin]);

  // While checking auth state, show the custom loader
  if (authLoading) {
    return <CustomLoader />;
  }
  
  const isAuthPage = pathname === '/' || pathname === '/register';
  
  // For users who are not logged in and are on auth pages
  if (!user && isAuthPage) {
    return (
        <Suspense fallback={<CustomLoader/>}>
            {children}
        </Suspense>
    );
  }

  // For logged-in users, show the app shell
  if (user) {
    return (
        <AppShell>
            <Suspense fallback={<CustomLoader/>}>
                <div className="pb-24 md:pb-0">
                    {children}
                </div>
            </Suspense>
        </AppShell>
    );
  }

  // Fallback for edge cases (e.g. logged out user on a protected route before redirect)
  return <CustomLoader />;
}
