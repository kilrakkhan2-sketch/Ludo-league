
'use client';

import { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await createUserWithEmailAndPassword(email, password);
      if (newUser) {
        // Create a user document in Firestore
        await setDoc(doc(db, "users", newUser.user.uid), {
          uid: newUser.user.uid,
          name: name,
          email: email,
          photoURL: '' , // or a default avatar
          role: 'player',
          walletBalance: 0,
          referralEarnings: 0,
          xp: 0,
          matchesPlayed: 0,
          matchesWon: 0,
          rating: 1000, // Starting ELO rating
          createdAt: new Date(),
        });
        router.push('/'); // Redirect to dashboard
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
          <p className="text-muted-foreground">Join the league of Ludo champions!</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
           <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            />
          </div>
           {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
             {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
