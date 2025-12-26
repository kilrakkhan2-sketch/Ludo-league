
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const numAmount = parseInt(amount, 10) || 0;
  const gstAmount = (numAmount * 0.28).toFixed(2);

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
                    placeholder="100"
                    className="w-full text-4xl font-bold h-auto p-4 pl-10 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
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

          {numAmount > 0 && (
             <Card>
                <CardContent className="p-4 space-y-3 text-sm">
                    <p className='text-xs text-center text-muted-foreground font-semibold mb-2'>GST Breakdown (For Information Only)</p>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">GST @28% (As per Govt. Regulation)</p>
                        <p className="font-mono text-red-500">- ₹{gstAmount}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">GST 28% Credit by Company</p>
                        <p className="font-mono text-green-500">+ ₹{gstAmount}</p>
                    </div>
                    <Separator className="my-2"/>
                    <div className="flex justify-between items-center font-bold text-base">
                        <p>Wallet Deposit Amount</p>
                        <p>₹{numAmount.toFixed(2)}</p>
                    </div>
                     <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>As per government regulations, 28% GST is applicable on deposits. We credit the same amount back to you so you get the full value!</p>
                    </div>
                </CardContent>
             </Card>
          )}
        </main>
        
        <footer className="p-4 sticky bottom-0 bg-background border-t space-y-3">
            {numAmount >= 100 && (
                 <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <p>You will receive 100% of your deposited amount in wallet.</p>
                </div>
            )}
             <Button onClick={handleProceed} className="w-full text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90" disabled={!amount || numAmount < 100}>
                Proceed to Add ₹{numAmount || 0}
            </Button>
        </footer>
    </div>
  );
}
