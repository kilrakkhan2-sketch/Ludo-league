'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wallet } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';

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

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">Add Money</h1>
        </header>

        <main className="flex-grow p-4 space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-md text-center">
              <Label htmlFor="amount" className="text-muted-foreground">Amount to Add (INR)</Label>
              <div className="relative mt-2">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-3xl font-bold">₹</span>
                   <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-4xl font-bold h-auto p-4 pl-10 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
              </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
              {quickAmounts.map(qAmount => (
                  <Button key={qAmount} variant="outline" className="py-6 text-base" onClick={() => setAmount(qAmount.toString())}>
                      ₹{qAmount}
                  </Button>
              ))}
          </div>
        </main>
        
        <footer className="p-4 sticky bottom-0 bg-background border-t">
             <Button onClick={handleProceed} className="w-full text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90" disabled={!amount}>
                Proceed to Add ₹{amount || 0}
            </Button>
        </footer>
    </div>
  );
}
