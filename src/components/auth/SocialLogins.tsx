'use client';

import { useSignInWithGoogle } from 'react-firebase-hooks/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google

export function SocialLogins() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result && firestore) {
        const user = result.user;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // New user, create a document
          const displayName = user.displayName || 'New Player';
          const referralCode = `${displayName.substring(0, 4).toUpperCase()}${nanoid(4)}`;
          await setDoc(userDocRef, {
            uid: user.uid,
            name: displayName,
            displayName: displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: 'user',
            walletBalance: 0,
            referralEarnings: 0,
            isVerified: false,
            xp: 0,
            matchesPlayed: 0,
            matchesWon: 0,
            rating: 1000,
            referralCode: referralCode,
            createdAt: Timestamp.now(),
          });
           toast({ title: "Account Created", description: "Welcome to LudoLeague!" });
        } else {
            toast({ title: "Logged In", description: "Welcome back!" });
        }
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: err.message });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
        <Chrome className="mr-2 h-5 w-5" />
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
      {error && <p className="text-sm text-destructive text-center">{error.message}</p>}
    </div>
  );
}
