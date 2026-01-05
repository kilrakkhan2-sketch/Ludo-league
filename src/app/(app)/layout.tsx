'use client';

import { ReactNode, useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/AppHeader';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there is no user, redirect to login page.
    // We allow some public pages to be accessible even without a user.
    if (!loading && !user) {
      const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
      if (!allowedPaths.includes(pathname)) {
        router.push('/'); // Assuming '/' is your login/landing page.
      }
    }
  }, [user, loading, pathname, router]);

  // While the auth state is loading, show a global loader.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your experience...</p>
      </div>
    );
  }

  // If loading is done and there is still no user, we are likely in the process
  // of redirecting. Show a minimal loading state.
  if (!user) {
    // For public pages accessible to non-logged-in users, show the content.
    const allowedPaths = ['/terms-and-conditions', '/privacy-policy', '/gst-policy', '/refund-policy'];
    if (allowedPaths.includes(pathname)) {
      return <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>;
    }

    return (
       <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
    )
  }
  
  // If we have a user, show the full app layout.
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
