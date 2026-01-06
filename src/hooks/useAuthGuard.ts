
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';

export const useAuthGuard = () => {
  const { user, loading: authLoading, isAdmin } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const isAuthPage = pathname === '/' || pathname === '/register';
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    if (!authLoading) {
      if (!user && !isAuthPage) {
        // Not logged in and not on an auth page, redirect to login
        router.replace('/');
      } else if (user && isAuthPage) {
        // Logged in and on an auth page, redirect to dashboard
        router.replace('/dashboard');
      } else if (user && isAdminPage && !isAdmin) {
        // Logged in, on an admin page, but not an admin, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // All other cases are fine, stop authenticating state
        setIsAuthenticating(false);
      }
    }
  }, [user, authLoading, pathname, router, isAuthPage, isAdmin, isAdminPage]);

  return {
    user,
    isAuthenticating: isAuthenticating || authLoading,
    isAdmin,
    isAuthPage
  };
};
