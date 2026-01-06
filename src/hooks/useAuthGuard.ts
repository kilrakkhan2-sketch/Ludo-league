
'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';

export const useAuthGuard = () => {
  const { user, loading: authLoading, isAdmin } = useUser();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/' || pathname === '/register';

  return {
    user,
    isAuthenticating: authLoading,
    isAdmin,
    isAuthPage,
  };
};
