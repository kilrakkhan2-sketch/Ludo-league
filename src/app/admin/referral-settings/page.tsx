
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Loader2, Save } from 'lucide-react';

type ReferralConfiguration = {
    commissionPercentage: number;
    updatedAt: any;
};

export default function ReferralSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [commission, setCommission] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const configRef = doc(firestore, 'referralConfiguration', 'settings');
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as ReferralConfiguration;
        setCommission(data.commissionPercentage);
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
    if (commission < 0 || commission > 100) {
      toast({ title: 'Commission must be between 0 and 100', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const configRef = doc(firestore, 'referralConfiguration', 'settings');
      await setDoc(configRef, {
        commissionPercentage: commission,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Referral commission updated successfully!', className: 'bg-green-100 text-green-800' });
    } catch (error: any) {
      toast({
        title: 'Failed to update settings',
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
        <Gift className="h-8 w-8 text-primary" />
        Referral Settings
      </h2>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Set Referral Commission</CardTitle>
          <CardDescription>
            This percentage will be given to the referrer from the first deposit of a new user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commission-percentage">Commission Percentage (%)</Label>
            {loading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading current settings...</span>
                </div>
            ) : (
                <Input
                    id="commission-percentage"
                    type="number"
                    placeholder="e.g., 5"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    min="0"
                    max="100"
                />
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
