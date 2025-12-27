
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { SocialLogins } from '@/components/auth/SocialLogins';
import { UserProfile } from '@/types';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function ReferralManager() {
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!searchParams) return;
        const refCode = searchParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            validateReferralCode(refCode);
        } else {
            setIsValidating(false);
        }
    }, [searchParams]);

    const validateReferralCode = async (code: string) => {
        if (!firestore) return;
        setIsValidating(true);
        setError(null);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('referralCode', '==', code));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                setReferrerName(referrerDoc.data().displayName);
            } else {
                setError('Invalid referral code.');
            }
        } catch (e) {
            setError('Could not validate referral code.');
        } finally {
            setIsValidating(false);
        }
    };
    
    if (!referralCode) return null;

    return (
      <div className="space-y-2">
        <Label htmlFor="referral">Referral Code</Label>
        <Input id="referral" value={referralCode} disabled />
        {isValidating && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Verifying code...</p>}
        {error && <p className="text-xs text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</p>}
        {referrerName && <p className="text-xs text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Code applied from: strong>{referrerName}</strong></p>}
      </div>
    );
}

function SignupPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Authentication service is not available." });
        return;
    }
    
    // Basic client-side validation
    if (!displayName.trim() || !email.trim() || !password.trim()) {
        toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all fields." });
        return;
    }
    if (password.length < 6) {
        toast({ variant: "destructive", title: "Password Too Short", description: "Password must be at least 6 characters long." });
        return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userRef = doc(firestore, "users", user.uid);
      const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
      const referralCode = `${sanitizedName}${nanoid(4)}`;
      
      const newUserProfile: Omit<UserProfile, 'id'> = {
          uid: user.uid,
          displayName: displayName,
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: 'user',
          rating: 1200,
          xp: 0,
          walletBalance: 0,
          matchesPlayed: 0,
          matchesWon: 0,
          totalWinnings: 0,
          referralCode: referralCode,
          referralEarnings: 0,
          referredBy: searchParams ? searchParams.get('ref') || undefined : undefined,
          isVerified: false,
          createdAt: Timestamp.now(),
      };

      await setDoc(userRef, newUserProfile);

      toast({ title: "Account Created", description: "Welcome to LudoLeague!" });
      router.replace('/dashboard');

    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unknown error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-2xl shadow-primary/10 border">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Create an Account</h1>
          <p className="text-muted-foreground">Join the league of Ludo champions!</p>
        </div>

        <SocialLogins />

         <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
           <div>
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <ReferralManager />

          <Button type="submit" className="w-full !mt-6" disabled={loading}>
             {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupPageContent />
        </Suspense>
    )
}
