
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
    if (!authLoading) {
      setIsAuthenticating(false);
    }
  }, [authLoading]);

  useEffect(() => {
    if (isAuthenticating) {
      return;
    }
    
    const isAuthPage = pathname === '/' || pathname === '/register';
    const isAdminPage = pathname.startsWith('/admin');

    if (!user) {
        if(!isAuthPage) {
            router.replace('/');
        }
    } else {
        if (isAuthPage) {
            router.replace('/dashboard');
        }
        else if (isAdminPage && !isAdmin) {
            router.replace('/dashboard');
        }
    }
    
  }, [user, isAuthenticating, router, pathname, isAdmin]);

  if (isAuthenticating) {
    return <CustomLoader />;
  }
  
  const isAuthPage = pathname === '/' || pathname === '/register';
  
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

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

  return <CustomLoader />;
}
