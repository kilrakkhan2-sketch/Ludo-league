
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AddMoneyPage() {
  const [amount, setAmount] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleProceed = () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum deposit is ₹100.',
      });
    } else {
      router.push(`/deposit?amount=${amount}`);
    }
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-headline mb-4">Add Money to Wallet</h1>
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-lg">Amount to Add</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., 500)"
                className="w-full text-2xl p-4 mt-2"
              />
            </div>
            <Button onClick={handleProceed} className="w-full text-lg py-6">
              Proceed to Deposit
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
