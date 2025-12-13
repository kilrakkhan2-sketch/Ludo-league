
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
import { Suspense } from 'react';

function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  // Safely get the amount from searchParams
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
        // You can show a loading state or a generic error.
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
                      </Aler