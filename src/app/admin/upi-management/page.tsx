
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign, Loader2, Save } from 'lucide-react';
import type { UpiConfiguration } from '@/lib/types';

export default function UpiManagementPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const configRef = doc(firestore, 'upiConfiguration', 'active');
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UpiConfiguration;
        setUpiId(data.activeUpiId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleSave = async () => {
    if (!firestore) {
      toast({ title: 'Firestore not available', variant: 'destructive' });
      return;
    }
    if (!upiId) {
      toast({ title: 'UPI ID cannot be empty', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const configRef = doc(firestore, 'upiConfiguration', 'active');
      await setDoc(configRef, {
        activeUpiId: upiId,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'UPI ID updated successfully!', className: 'bg-green-100 text-green-800' });
    } catch (error: any) {
      toast({
        title: 'Failed to update UPI ID',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4 flex items-center gap-2">
        <AtSign className="h-8 w-8 text-primary" />
        UPI Management
      </h2>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Set Active Deposit UPI ID</CardTitle>
          <CardDescription>
            This UPI ID will be shown to all users on the deposit page to receive payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-id">Active UPI ID</Label>
            {loading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading current UPI ID...</span>
                </div>
            ) : (
                <Input
                    id="upi-id"
                    placeholder="e.g., yourbusiness@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                />
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save UPI ID
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

    