
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletBalance() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user] = useAuthState(auth);
  const [userData, loading] = useDocumentData(user ? doc(firestore, 'users', user.uid) : undefined);

  if (loading) {
    return <Skeleton className="h-8 w-24" />;
  }

  return (
    <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm font-medium bg-background">
      <Wallet className="h-4 w-4 text-primary" />
      <span>₹{userData?.walletBalance ?? 0}</span>
    </div>
  );
}
