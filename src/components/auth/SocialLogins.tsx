
'use client';

import { useEffect } from 'react';
import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google
import type { UserProfile } from '@/types';

export function SocialLogins() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = () => {
    signInWithGoogle();
  };
  
  useEffect(() => {
    if (error) {
       toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  }, [error, toast]);

  useEffect(() => {
    const setupUser = async () => {
        if (user && firestore) {
            const userRef = doc(firestore, 'users', user.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                const displayName = user.user.displayName || 'New Player';
                // Generate referral code for new social sign-up
                const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
                const referralCode = `${sanitizedName}${nanoid(4)}`;
                
                const newUserProfile: Omit<UserProfile, 'id'> = {
                    uid: user.user.uid,
                    displayName: displayName,
                    email: user.user.email || '',
                    photoURL: user.user.photoURL || '',
                    role: 'user',
                    wallet: { balance: 0 },
                    stats: {
                        matchesPlayed: 0,
                        matchesWon: 0,
                        totalWinnings: 0,
                    },
                    rating: 1000, // Add rating property
                    xp: 0,       // Add xp property
                    referralCode: referralCode, // Save the generated code
                    referralEarnings: 0,
                    isVerified: false,
                    createdAt: Timestamp.now(),
                };
                
                await setDoc(userRef, newUserProfile);
                toast({ title: "Account Created", description: "Welcome to LudoLeague!" });
            } else {
                toast({ title: "Logged In", description: "Welcome back!" });
            }
            router.push('/dashboard');
        }
    }
    setupUser();
  }, [user, firestore, router, toast]);

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
        <Chrome className="mr-2 h-5 w-5" />
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </div>
  );
}
