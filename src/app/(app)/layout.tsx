
'use client';

import { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import CustomLoader from '@/components/CustomLoader';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticating, isAuthPage, user } = useAuthGuard();

  if (isAuthenticating) {
    return <CustomLoader />;
  }
  
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  if (user && !isAuthPage) {
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

  // Fallback for edge cases, like a logged in user on an auth page,
  // where the guard has already initiated a redirect.
  return <CustomLoader />;
}
