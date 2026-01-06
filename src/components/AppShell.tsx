
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { BottomNav } from '@/components/app/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import NoSsr from '@/components/NoSsr';
import { useFcm } from '@/hooks/useFcm';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const pathname = usePathname();
  useFcm(); // Initialize FCM and request permission

  // Render AppShell only on non-admin pages
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <NoSsr>
      <SidebarProvider>
        <div className="relative flex flex-col min-h-screen w-full bg-muted/20 overflow-x-hidden">
            <FirebaseErrorListener/>
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="md:hidden w-64 p-0">
                      <SheetHeader className="p-4 border-b">
                         <SheetTitle>Ludo League</SheetTitle>
                      </SheetHeader>
                      <Sidebar />
                    </SheetContent>
                </Sheet>
                <AppHeader />
            </header>
            <div className="flex flex-1">
              <aside className="hidden md:block md:w-64">
                <Sidebar />
              </aside>
              <main className="flex-1 p-4 md:p-6">
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
