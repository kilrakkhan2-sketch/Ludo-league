'use client';

import { useState } from 'react';
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trophy, UserPlus, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUpWithEmail(email, password, displayName);
      toast({ title: "Account Created!", description: "Welcome! Please check your email to verify your account." });
    } catch (error: any) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-8">
       <div 
        className="w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-white"
       >
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-block p-3 bg-white/10 rounded-full mb-4">
                    <UserPlus className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter text-white">Create Your Account</h1>
                <p className="text-white/70 mt-1">Join the ultimate Ludo arena.</p>
            </div>

            {/* Google Sign-in */}
            <div className="mb-6">
                <Button 
                    onClick={signInWithGoogle} 
                    disabled={loading.google} 
                    className="w-full h-12 bg-white text-black hover:bg-gray-200 font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
                >
                    <GoogleIcon className="h-5 w-5 mr-3" />
                    {loading.google ? "Signing up..." : "Sign up with Google"}
                </Button>
            </div>

            {/* Separator */}
            <div className="flex items-center my-6">
                <hr className="w-full border-white/20" />
                <span className="px-4 text-white/50 text-sm">OR</span>
                <hr className="w-full border-white/20" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50"/>
                    <Input 
                        type="text" 
                        placeholder="Display Name" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)} 
                        required 
                        className="bg-white/5 border-white/20 h-12 pl-10 text-white placeholder:text-white/50 focus:ring-primary focus:border-primary"
                    />
                </div>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50"/>
                    <Input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-white/5 border-white/20 h-12 pl-10 text-white placeholder:text-white/50 focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50"/>
                    <Input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="bg-white/5 border-white/20 h-12 pl-10 text-white placeholder:text-white/50 focus:ring-primary focus:border-primary"
                    />
                </div>
                <Button type="submit" disabled={loading.email} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold text-lg transition-all duration-300 transform hover:scale-105">
                    {loading.email ? "Creating Account..." : "Sign Up with Email"}
                </Button>
            </form>

            {/* Footer Link */}
            <div className="text-center mt-6">
                <p className="text-sm text-white/60">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}
