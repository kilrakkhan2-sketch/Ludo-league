
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useUser } from '@/firebase/auth/use-user';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { AppSettings } from '@/types';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// The page that uses this component should wrap it in <Suspense>
export default function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const amount = searchParams ? searchParams.get('amount') : null;

  const { data: paymentSettings, loading: settingsLoading } = useDoc<AppSettings>('settings/payment');

  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setScreenshot(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !transactionId || !screenshot || !user || !firestore) {
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
               <div className="flex justify-center">
                  <Skeleton className="w-48 h-48" />
               </div>
                {settingsLoading ? (
                    <Skeleton className="h-8 w-full" />
                ) : paymentSettings ? (
                  <div className="text-center">
                    <Label className="text-muted-foreground">or pay to UPI ID</Label>
                    <p className="text-lg font-mono tracking-wider">{paymentSettings.upiId}</p>
                  </div>
                ) : (
                    <p className="text-center text-destructive">Could not load payment details.</p>
                )}
                 <div className='text-center pt-2'>
                    <p className="text-muted-foreground">Amount to pay</p>
                    <p className="text-3xl font-bold">₹{amount}</p>
                </div>
              </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Submit Payment Details</h2>
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
        <Button onClick={handleSubmit} className="w-full text-lg py-6" disabled={isSubmitting || !screenshot || !transactionId}>
            {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
        </Button>
      </footer>
    </div>
  );
}
