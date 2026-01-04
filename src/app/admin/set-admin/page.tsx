'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SetAdminPage() {
  const { app } = useFirebase();
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSetAdmin = async () => {
    if (!uid) {
      toast({
        title: 'Error',
        description: 'Please enter a User ID (UID).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions(app);
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      const result = await setAdminClaim({ uid });
      
      toast({
        title: 'Success',
        description: (result.data as { message: string }).message,
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error setting admin claim',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUid('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Set Admin Claim</h1>
        <p className="text-sm text-center text-gray-600">
          Enter the UID of the user you want to make an admin. You can find the UID in the Firebase Authentication console.
        </p>
        <div className="space-y-2">
          <Label htmlFor="uid">User ID (UID)</Label>
          <Input
            id="uid"
            type="text"
            placeholder="Enter User ID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button onClick={handleSetAdmin} disabled={loading} className="w-full">
          {loading ? 'Processing...' : 'Make Admin'}
        </Button>
      </div>
    </div>
  );
}
