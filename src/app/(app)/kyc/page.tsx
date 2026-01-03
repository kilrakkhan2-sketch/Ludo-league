
'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, FileUp, Loader2, ShieldCheck, XCircle, Landmark, AtSign } from 'lucide-react';

type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

const KycStatusIndicator = ({ status, reason }: { status: KycStatus, reason?: string }) => {
    switch (status) {
        case 'approved':
            return (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 !text-green-600" />
                    <AlertTitle>KYC Approved</AlertTitle>
                    <AlertDescription>Your KYC has been successfully verified. Your wallet is fully active for withdrawals.</AlertDescription>
                </Alert>
            );
        case 'pending':
            return (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <Clock className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle>KYC Pending</AlertTitle>
                    <AlertDescription>Your documents have been submitted and are under review. This usually takes 24-48 hours.</AlertDescription>
                </Alert>
            );
        case 'rejected':
            return (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>KYC Rejected</AlertTitle>
                    <AlertDescription>
                        Your KYC submission was rejected. Please review the reason below and resubmit.
                        {reason && <p className="font-semibold mt-2">Reason: {reason}</p>}
                    </AlertDescription>
                </Alert>
            );
        default:
            return null;
    }
};


export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<KycStatus>('not_submitted');
    const [rejectionReason, setRejectionReason] = useState("Selfie was not clear.");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setKycStatus('pending');
            setIsSubmitting(false);
        }, 2000);
    };

    const canSubmit = kycStatus === 'not_submitted' || kycStatus === 'rejected';


  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary"/>
            KYC Verification
        </h2>
      </div>

       <div className="grid gap-6">
        <KycStatusIndicator status={kycStatus} reason={rejectionReason} />

        <Card>
          <CardHeader>
            <CardTitle>Submit Documents & Bank Details</CardTitle>
            <CardDescription>
                {canSubmit 
                ? "Upload your documents and provide payment details. Withdrawals will only be processed to the verified Bank Account or UPI ID."
                : "Your documents are currently under review. You can resubmit if your application is rejected."
                }
            </CardDescription>
          </CardHeader>
          {canSubmit && (
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="id-proof">Aadhaar / PAN Card</Label>
                            <Input id="id-proof" type="file" required className="file:text-primary"/>
                            <p className="text-xs text-muted-foreground">Upload a clear image of the front of your document.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="selfie">Selfie</Label>
                            <Input id="selfie" type="file" required className="file:text-primary"/>
                            <p className="text-xs text-muted-foreground">Upload a clear, recent selfie.</p>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-details" className='flex items-center gap-2'><Landmark className='w-4 h-4'/> Bank Account Details</Label>
                            <Textarea id="bank-details" placeholder="Enter your full name, bank name, account number, and IFSC code." required rows={4}/>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                OR
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="upi-id" className='flex items-center gap-2'><AtSign className='w-4 h-4'/> UPI ID</Label>
                            <Input id="upi-id" placeholder="yourname@upi" required />
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} variant="accent" className="w-full md:w-auto">
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</>
                        ) : (
                            <><FileUp className="mr-2 h-4 w-4"/> Submit for Verification</>
                        )}
                    </Button>
                </form>
            </CardContent>
           )}
        </Card>
      </div>
    </>
  );
}
