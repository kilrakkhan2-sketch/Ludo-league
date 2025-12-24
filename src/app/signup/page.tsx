'use client';

import React, { useState, useEffect } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { SocialLogins } from '@/components/auth/SocialLogins';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const auth = useAuth();
  const firestore = useFirestore();
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    createUserWithEmailAndPassword(email, password);
  };

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const setupUser = async () => {
      if (user && firestore && displayName) {
        try {
            // Update Firebase Auth profile
            await updateProfile(user.user, { displayName });

            // Create user document in Firestore
            const userRef = doc(firestore, "users", user.user.uid);
            const referralCode = `${displayName.substring(0, 4).toUpperCase()}${nanoid(4)}`;
            
            await setDoc(userRef, {
                uid: user.user.uid,
                name: displayName,
                displayName: displayName,
                email: email,
                photoURL: '',
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
            router.push('/dashboard');

        } catch (setupError: any) {
            toast({ variant: "destructive", title: "Setup Failed", description: setupError.message });
        }
      }
    };
    setupUser();
  }, [user, firestore, displayName, email, router, toast]);

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
