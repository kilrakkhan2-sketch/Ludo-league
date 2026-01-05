
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account
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
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                        Login with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
