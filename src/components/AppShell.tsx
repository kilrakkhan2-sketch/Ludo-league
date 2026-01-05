
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
    <div className="flex flex-col min-h-screen bg-muted/20">
        <FirebaseErrorListener/>
        <AppHeader />
        <main className="flex-1 container mx-auto p-4 md:p-6">
            {children}
        </main>
        <Toaster/>
        <BottomNav />
    </div>
  );
};

export default AppShell;
