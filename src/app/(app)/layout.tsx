
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
    // This effect handles redirection logic based on authentication status.
    // It waits until the authentication check is complete before making decisions.
    if (isAuthenticating) {
      return; // Wait for authentication to resolve
    }

    const isAdminPage = pathname.startsWith('/admin');

    // Case 1: Unauthenticated user on a protected page
    if (!user && !isAuthPage) {
      router.replace('/'); // Redirect to login
      return;
    }

    // Case 2: Authenticated user on a public auth page
    if (user && isAuthPage) {
      router.replace('/dashboard'); // Redirect to dashboard
      return;
    }

    // Case 3: Authenticated, non-admin user trying to access an admin page
    if (user && isAdminPage && !isAdmin) {
      router.replace('/dashboard'); // Redirect to dashboard
      return;
    }
  }, [user, isAuthenticating, isAdmin, isAuthPage, pathname, router]);

  // Show a loader while authentication is in progress or during redirects.
  if (isAuthenticating || (!user && !isAuthPage) || (user && isAuthPage)) {
    return <CustomLoader />;
  }
  
  // If a user exists and they are on a protected page (not an auth page), render the app shell.
  if (user && !isAuthPage) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
          <Suspense fallback={<CustomLoader />}>
            {children}
          </Suspense>
        </main>
      </AppShell>
    );
  }

  // If there's no user and they are correctly on a public auth page, render that page.
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  // A fallback loader for any other transitional states.
  return <CustomLoader />;
}
