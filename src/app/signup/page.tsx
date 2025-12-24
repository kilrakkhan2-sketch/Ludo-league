'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { SocialLogins } from '@/components/auth/SocialLogins';
import { UserProfile } from '@/types';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

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
          wallet: {
            balance: 0,
          },
          stats: {
            matchesPlayed: 0,
            matchesWon: 0,
            totalWinnings: 0,
          },
          referralCode: referralCode,
          referralEarnings: 0,
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
