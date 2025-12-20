
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFunctions } from '@/firebase'; // Import useFunctions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable

export default function MakeAdminPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const functions = useFunctions(); // Get the functions instance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized. Please try again.' });
        return;
    }
    setLoading(true);

    try {
      // Get a reference to the callable function
      const setSuperAdminRole = httpsCallable(functions, 'setSuperAdminRole');
      
      // Call the function with the email
      const result = await setSuperAdminRole({ email });
      
      const data = result.data as { message: string };

      // Force refresh the user's ID token to get the new custom claim
      await user.getIdToken(true);

      toast({
        title: 'Success!',
        description: data.message,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Grant Superadmin Access</CardTitle>
          <CardDescription>
            Enter the email of the user you want to make a superadmin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user's email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? 'Granting Access...' : 'Make Superadmin'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Go to{' '}
                <Link href="/admin/dashboard" className="text-primary hover:underline">
                  Admin Panel
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
