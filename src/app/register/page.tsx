
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { signUpWithEmail, signInWithGoogle } from "@/firebase/auth/client";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      toast({
        variant: "success",
        title: "Account Created Successfully",
        description: "Welcome to Ludo League! You are now logged in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({
        variant: "success",
        title: "Account Created Successfully",
        description: "Welcome to Ludo League! You are now logged in.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-Up Failed",
        description: error.message || "Could not sign up with Google.",
      });
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Card className="mx-auto max-w-sm">
        <form onSubmit={handleRegister}>
          <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-2">
                  <Swords className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl font-bold">Ludo League</CardTitle>
              </div>
            <CardDescription>Enter your information to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" placeholder="Max" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create an account
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading} type="button">
                 {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign up with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/" className="underline text-primary font-semibold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
