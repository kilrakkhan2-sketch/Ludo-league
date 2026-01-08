'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/firebase"
import { Separator } from "@/components/ui/separator"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Swords } from "lucide-react";

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast({ title: 'Login Successful', description: 'Welcome back!' });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Login error:", error);
            toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            toast({ title: 'Login Successful', description: 'Welcome!' });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Google login error:", error);
            toast({ title: 'Google Login Failed', description: error.message, variant: 'destructive' });
        }
    };
    
    const bgImage = PlaceHolderImages.find(img => img.id === 'ludo-background');

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4">
             {bgImage && (
                <Image
                    src={bgImage.imageUrl}
                    alt={bgImage.description}
                    fill
                    className="object-cover z-0"
                />
            )}
            <div className="absolute inset-0 bg-black/50 z-10" />
            
            <Card className="relative z-20 mx-auto max-w-sm w-full bg-background/80 backdrop-blur-sm border-white/20">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <Swords className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Ludo Game</h1>
                    </div>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <a href="/forgot-password" className="ml-auto inline-block text-sm underline">
                                    Forgot your password?
                                </a>
                            </div>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                suppressHydrationWarning
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                    <Separator className="my-6" />
                    <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin} disabled={loading}>
                        Login with Google
                    </Button>
                     <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <a href="/register" className="underline">
                            Sign up
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
