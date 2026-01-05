
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
import { Menu, Swords } from "lucide-react";
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-muted/20">
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
                    <Sidebar />
                  </SheetContent>
              </Sheet>
              <AppHeader />
          </header>
          <div className="flex min-h-screen">
            <aside className="hidden md:block md:w-64">
              <Sidebar />
            </aside>
            <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
          </div>
          <Toaster/>
          <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
