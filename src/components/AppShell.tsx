
'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePathname } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useBalance } from '@/hooks/useBalance';
import AppHeader from '@/components/AppHeader';
import { BottomNav } from '@/components/app/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { errorEmitter } from '@/firebase/error-emitter';
import { useFirestore } from '@/firebase';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const { setBalance } = useBalance();
  const pathname = usePathname();
  const firestore = useFirestore();

  useEffect(() => {
    if (user && firestore) {
      const db = firestore;
      const transactionsRef = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(transactionsRef, 
        (snapshot) => {
          let total = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.type === 'deposit' || data.type === 'withdrawal') {
              total += data.status === 'completed' ? (data.type === 'deposit' ? data.amount : -data.amount) : 0;
            }
            if (data.type === 'match_win' || data.type === 'match_fee') {
                total += data.type === 'match_win' ? data.amount : -data.amount
            }
          });
          setBalance(total);
        },
        (err) => {
            // Forward the original Firestore error
            if (err.code === 'permission-denied') {
                 errorEmitter.emit('permission-error', err);
            } else {
                console.error("Error fetching transactions:", err)
            }
        }
      );

      return () => unsubscribe();
    }
  }, [user, setBalance, firestore]);

  // Render AppShell only on non-admin pages
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
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
                    <SheetHeader className="p-4">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
  );
};

export default AppShell;
