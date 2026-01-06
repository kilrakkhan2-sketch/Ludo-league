
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/app/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sidebar, SidebarProvider, SidebarNav, SidebarSheet } from '@/components/ui/sidebar';
import NoSsr from '@/components/NoSsr';
import { useFcm } from '@/hooks/useFcm';
import AppHeader from './AppHeader';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  useFcm(); // Initialize FCM and request permission

  // Render AppShell only on non-admin pages
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <NoSsr>
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full bg-background">
            <FirebaseErrorListener/>
            <aside className="hidden md:block md:w-64 border-r border-border">
              <Sidebar />
            </aside>
            <SidebarSheet>
                <SidebarNav />
            </SidebarSheet>
            <div className="flex flex-col flex-1">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 bg-gradient-to-r from-primary-start to-primary-end text-primary-foreground px-6">
                    <AppHeader/>
                </header>
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            <Toaster/>
            <BottomNav />
        </div>
      </SidebarProvider>
    </NoSsr>
  );
};

export default AppShell;
