'use client';

import { useEffect } from 'react';
import { getFirebaseApp } from '@/firebase/auth/client';
import { getAuth } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const FirebaseErrorListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // toast({ 
        //   variant: 'success', 
        //   title: 'Signed in', 
        //   description: `Welcome back, ${user.displayName || 'User'}!` 
        // });
      }
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
};

export default FirebaseErrorListener;
