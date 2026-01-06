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
    if (!isAuthenticating) {
      const isAdminPage = pathname.startsWith('/admin');

      if (!user && !isAuthPage) {
        // Not logged in and not on an auth page, redirect to login
        router.replace('/');
      } else if (user && isAuthPage) {
        // Logged in and on an auth page, redirect to dashboard
        router.replace('/dashboard');
      } else if (user && isAdminPage && !isAdmin) {
        // Logged in, on an admin page, but not an admin, redirect to dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, isAuthenticating, isAdmin, isAuthPage, pathname, router]);

  if (isAuthenticating) {
    return <CustomLoader />;
  }

  // If user is authenticated and not on an auth page, render the app shell.
  if (user && !isAuthPage) {
    return (
      <AppShell>
        <Suspense fallback={<CustomLoader />}>
          <div className="pb-24 md:pb-0">{children}</div>
        </Suspense>
      </AppShell>
    );
  }

  // If user is not authenticated and on an auth page, render the auth page.
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  // In other cases (like a redirect is happening), show a loader.
  return <CustomLoader />;
}
