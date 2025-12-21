
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UpiAccount } from '@/types';
import { ArrowLeft, UploadCloud, Copy, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


// The page that uses this component should wrap it in <Suspense>
export default function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const amount = searchParams ? searchParams.get('amount') : null;

  // Find the first UPI account that is active and has not reached its daily limit.
  const { data: paymentAccounts, loading: settingsLoading } = useCollection<UpiAccount>('upi-accounts', {
      where: [
        ['isActive', '==', true],
      ],
      orderBy: ['createdAt', 'asc']
  });
  
  const [activeUpiAccount, setActiveUpiAccount] = useState<UpiAccount | null | undefined>(undefined);

  useEffect(() => {
    if (paymentAccounts && paymentAccounts.length > 0) {
        // Find the first account that is under its daily limit
        const availableAccount = paymentAccounts.find(acc => acc.dailyAmountReceived < acc.dailyLimit);
        setActiveUpiAccount(availableAccount || null);
    } else if (!settingsLoading) {
        setActiveUpiAccount(null);
    }
  }, [paymentAccounts, settingsLoading]);


  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!', description: text });
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setScreenshot(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !transactionId || !screenshot || !user || !firestore || !activeUpiAccount) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields and upload a screenshot.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const storage = getStorage();
      const screenshotRef = ref(storage, `deposit-screenshots/${user.uid}/${Date.now()}_${screenshot.name}`);
      await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      await addDoc(collection(firestore, 'deposit-requests'), {
        userId: user.uid,
        userName: user.displayName || 'N/A',
        userEmail: user.email || 'N/A',
        amount: parseInt(amount, 10),
        transactionId,
        screenshotUrl,
        upiAccountId: activeUpiAccount.id, // Save the selected UPI account ID
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your request is pending verification. We will notify you shortly.',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Deposit error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request. Please try again.' });
      setIsSubmitting(false);
    }
  };
  
    if (amount === null) {
        // This case handles when searchParams is not yet available.
        return (
             <div className="flex flex-col min-h-screen bg-muted/30">
                <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Loading...</h1>
                </header>
                <main className="flex-grow p-4 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        )
    }

    if (!amount) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                 <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft /></Button>
                    <h1 className="text-xl font-bold">Error</h1>
                </header>
                <div className="flex-grow flex items-center justify-center p-4">
                    <Alert variant="destructive" className="max-w-sm">
                      <AlertTitle>Invalid Amount</AlertTitle>
                      <AlertDescription>
                        No amount specified. Please go back and enter an amount to deposit.
                      </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">Complete Deposit</h1>
        </header>
      <main className="flex-grow p-4 space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-center">Scan & Pay</h2>
             <div className="space-y-4">
                <div className='text-center pt-2'>
                    <p className="text-muted-foreground">Amount to pay</p>
                    <p className="text-4xl font-bold">₹{amount}</p>
                </div>
                 {activeUpiAccount === undefined ? (
                    <Skeleton className="h-20 w-full" />
                ) : activeUpiAccount ? (
                  <div className="space-y-3">
                    <Label className="text-muted-foreground text-center block">1. Pay to the UPI ID below</Label>
                    <div className={cn( "font-mono tracking-wider bg-muted p-3 rounded-lg flex items-center justify-between cursor-pointer border-2 border-primary bg-primary/10" )}>
                        <div>
                            <p className='text-sm text-foreground font-sans'>{activeUpiAccount.displayName}</p>
                            <p>{activeUpiAccount.upiId}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(activeUpiAccount.upiId)}>
                            <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                  </div>
                ) : (
                    <Alert variant="destructive">
                      <RefreshCw className="h-4 w-4" />
                      <AlertTitle>Payments Temporarily Unavailable</AlertTitle>
                      <AlertDescription>All our payment gateways are currently busy. Please try again in a few moments.</AlertDescription>
                    </Alert>
                )}
              </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">2. Submit Payment Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transactionId">Transaction ID / UPI Reference No.</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter the 12-digit reference number"
                />
              </div>
              <div>
                <Label htmlFor="screenshot">Upload Screenshot</Label>
                <label htmlFor="screenshot" className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                         {screenshot ? (
                           <p className="text-sm font-semibold text-primary">{screenshot.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center"><span className="font-semibold">Click to upload</span></p>
                        )}
                    </div>
                    <Input id="screenshot" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
            </div>
          </div>
      </main>
      <footer className="p-4 sticky bottom-0 bg-background border-t">
        <Button onClick={handleSubmit} className="w-full text-lg py-6" disabled={isSubmitting || !screenshot || !transactionId || !activeUpiAccount}>
            {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
        </Button>
      </footer>
    </div>
  );
}
