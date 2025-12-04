
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { addDoc, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function DepositPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const { data: paymentSettings, loading: settingsLoading } = useCollection('settings', { where: ['id', '==', 'payment'], limit: 1 });
  const paymentGateway = paymentSettings.length > 0 ? paymentSettings[0] : null;

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
        amount: parseInt(amount, 10),
        transactionId,
        screenshotUrl,
        status: 'pending',
        createdAt: new Date(),
      });

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your request is pending verification. We will notify you shortly.',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Deposit error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your request. Please try again.' });
    }
    setIsSubmitting(false);
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-headline mb-4">Complete Your Deposit</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
            {settingsLoading ? (
                <p>Loading payment details...</p>
            ) : paymentGateway ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-lg">Amount</Label>
                  <p className="text-3xl font-bold">₹{amount}</p>
                </div>
                <div>
                  <Label className="text-lg">UPI ID</Label>
                  <p className="text-xl font-mono">{paymentGateway.upiId}</p>
                </div>
                {paymentGateway.qrCodeUrl && (
                  <div>
                    <Label className="text-lg">Scan QR Code</Label>
                    <img src={paymentGateway.qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 mt-2" />
                  </div>
                )}
                <div className='text-sm text-muted-foreground pt-4'>
                    <p>1. Complete the payment using your preferred UPI app.</p>
                    <p>2. Take a screenshot of the successful payment.</p>
                    <p>3. Fill out the form on the right and submit your request.</p>
                </div>
              </div>
            ) : (
                <p>Could not load payment details. Please try again later.</p>
            )}
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Submit Your Request</h2>
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
                <Input id="screenshot" type="file" onChange={handleFileChange} accept="image/*" />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
