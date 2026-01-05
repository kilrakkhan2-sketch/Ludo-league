
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { BottomNav } from '@/components/app/bottom-nav';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
          <Sidebar />
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
           <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <Sheet>
                  <SheetTrigger asChild>
                      <Button size="icon" variant="outline" className="sm:hidden">
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Toggle Menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="sm:hidden w-64 p-0">
                    <Sidebar />
                  </SheetContent>
              </Sheet>
              <AppHeader />
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
