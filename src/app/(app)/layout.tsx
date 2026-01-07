
'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import CustomLoader from '@/components/CustomLoader';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticating, isAdmin, isAuthPage } = useAuthGuard();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the authentication check is complete
    if (!isAuthenticating) {
      const isAdminPage = pathname.startsWith('/admin');

      // If there is no user and the page is not a public auth page, redirect to login.
      if (!user && !isAuthPage) {
        router.replace('/');
      } 
      // If the user is logged in and trying to access an auth page, redirect to dashboard.
      else if (user && isAuthPage) {
        router.replace('/dashboard');
      } 
      // If the user is logged in, on an admin page, but is not an admin, redirect to dashboard.
      else if (user && isAdminPage && !isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, isAuthenticating, isAdmin, isAuthPage, pathname, router]);


  // While authentication is in progress, or if we are waiting for a redirect, show a loader.
  if (isAuthenticating || (!user && !isAuthPage) || (user && isAuthPage)) {
    return <CustomLoader />;
  }
  
  // If a user exists and they are on a protected page, render the app shell.
  if (user && !isAuthPage) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Suspense fallback={<CustomLoader />}>
            {children}
          </Suspense>
        </main>
      </AppShell>
    );
  }

  // If there's no user and they are on a public auth page, render that page.
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  // Fallback loader for any other edge cases during transition.
  return <CustomLoader />;
}
