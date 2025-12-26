
'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { ArrowLeft, UploadCloud, Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';


// The page that uses this component should wrap it in <Suspense>
export default function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const amount = searchParams ? searchParams.get('amount') : null;

  const { data: allUpiAccounts, loading: settingsLoading } = useCollection<UpiAccount>('upi-accounts', {
      orderBy: ['createdAt', 'asc']
  });
  
  const [selectedUpiAccount, setSelectedUpiAccount] = useState<UpiAccount | null>(null);

  // New state to manage the two-step flow
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (allUpiAccounts && allUpiAccounts.length > 0) {
        const availableAccounts = allUpiAccounts.filter(acc => 
            acc.isActive && (acc.dailyAmountReceived || 0) < acc.dailyLimit
        );
        
        if (availableAccounts.length > 0) {
            const bestAccount = availableAccounts.reduce((best, current) => {
                const bestUtilization = (best.dailyAmountReceived / best.dailyLimit);
                const currentUtilization = (current.dailyAmountReceived / current.dailyLimit);
                return currentUtilization < bestUtilization ? current : best;
            });
            setSelectedUpiAccount(bestAccount);
        } else {
            setSelectedUpiAccount(null);
        }
    } else if (!settingsLoading) {
        setSelectedUpiAccount(null);
    }
  }, [allUpiAccounts, settingsLoading]);


  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upiUrl = selectedUpiAccount && amount 
    ? `upi://pay?pa=${selectedUpiAccount.upiId}&pn=${selectedUpiAccount.displayName}&am=${amount}&cu=INR`
    : '';
  
  const qrCodeUrl = upiUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`
    : '';


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
    if (!amount || !transactionId || !screenshot || !user || !firestore || !selectedUpiAccount) {
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
        upiAccountId: selectedUpiAccount.id,
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
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                    {paymentConfirmed ? <span className="flex items-center justify-center gap-2 text-green-500"><CheckCircle/> Payment Step Completed</span> : "1. Scan & Pay"}
                </CardTitle>
            </CardHeader>
            <CardContent className={cn(!paymentConfirmed && "p-6")}>
             <div className={cn("space-y-4", !paymentConfirmed ? "block" : "hidden")}>
                <div className='text-center pt-2'>
                    <p className="text-muted-foreground">Amount to pay</p>
                    <p className="text-4xl font-bold">₹{amount}</p>
                </div>
                 {settingsLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-48 w-48" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : selectedUpiAccount ? (
                  <div className="space-y-4 text-center">
                    <div className="bg-white p-4 inline-block rounded-lg border shadow-md">
                        <Image src={qrCodeUrl} alt="UPI QR Code" width={200} height={200} />
                    </div>
                    <div onClick={() => copyToClipboard(selectedUpiAccount.upiId)} className="font-mono tracking-wider bg-muted p-3 rounded-lg flex items-center justify-between cursor-pointer border-2 border-dashed border-primary">
                        <p>{selectedUpiAccount.upiId}</p>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button asChild size="lg" className="w-full">
                        <a href={upiUrl}>Pay with UPI</a>
                    </Button>
                  </div>
                ) : (
                    <Alert variant="destructive">
                      <RefreshCw className="h-4 w-4" />
                      <AlertTitle>Payments Temporarily Unavailable</AlertTitle>
                      <AlertDescription>All our payment gateways are currently busy. Please try again in a few moments.</AlertDescription>
                    </Alert>
                )}
              </div>
          </CardContent>
          </Card>

          {paymentConfirmed && (
             <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-center">2. Submit Payment Details</h2>
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
            </Card>
          )}
      </main>
      <footer className="p-4 sticky bottom-0 bg-background border-t">
        {!paymentConfirmed ? (
             <Button onClick={() => setPaymentConfirmed(true)} className="w-full text-lg py-6" disabled={!selectedUpiAccount}>
                I have completed the payment
            </Button>
        ) : (
            <Button onClick={handleSubmit} className="w-full text-lg py-6" disabled={isSubmitting || !screenshot || !transactionId || !selectedUpiAccount}>
                {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
            </Button>
        )}
      </footer>
    </div>
  );
}
