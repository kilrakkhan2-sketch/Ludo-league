
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swords, Loader2, Zap, ShieldCheck, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail, signInWithGoogle } from "@/firebase/auth/client";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message || "Could not sign in with Google.",
      });
      setIsGoogleLoading(false);
    }
  };

  const marketingFeatures = [
    {
      icon: Zap,
      title: "Instant Withdrawals",
      description: "Get your winnings in your account within minutes."
    },
    {
      icon: ShieldCheck,
      title: "Secure & Fair Platform",
      description: "We use advanced fraud detection to ensure fair play."
    },
    {
      icon: LifeBuoy,
      title: "24/7 Customer Support",
      description: "Our team is always here to help you with any issues."
    }
  ];


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-start justify-center p-12 text-foreground space-y-8 bg-muted/40 h-full">
        <div className="flex items-center gap-3">
          <Swords className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Ludo League</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          India's most trusted platform for competitive Ludo. Join thousands of players and win real cash!
        </p>
        <div className="space-y-6 pt-4">
          {marketingFeatures.map(feature => (
            <div key={feature.title} className="flex items-start gap-4">
              <feature.icon className="h-8 w-8 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-md">
          <form onSubmit={handleLogin}>
            <Card className="mx-auto border-0 shadow-none lg:border lg:shadow-lg">
              <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center items-center gap-2 lg:hidden">
                  <Swords className="h-8 w-8 text-primary" />
                  <CardTitle className="text-3xl font-bold">Ludo League</CardTitle>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
                <CardDescription>Enter your email below to login to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link href="#" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                      </Link>
                    </div>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading} type="button">
                    {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login with Google
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="underline text-primary font-semibold">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
