
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, FileUp, Loader2, ShieldCheck, XCircle, Landmark, AtSign } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

const bannerImage = PlaceHolderImages.find(img => img.id === 'kyc-banner');

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
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idProof, setIdProof] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    const kycStatus: KycStatus = userProfile?.kycStatus || 'not_submitted';
    const rejectionReason = userProfile?.kycRejectionReason;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };
    
    const uploadFile = async (file: File, path: string): Promise<string> => {
        const storage = getStorage();
        const storageRef = ref(storage, path);
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const dataUrl = e.target?.result as string;
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    resolve(downloadUrl);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !firestore || !idProof || !selfie) {
            toast({
                title: "Error",
                description: "Please fill all fields and upload both documents.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const bankDetails = formData.get('bank-details') as string;
            const upiId = formData.get('upi-id') as string;
            
            if(!bankDetails && !upiId) {
                toast({
                    title: "Payment Info Missing",
                    description: "Please provide either bank details or a UPI ID.",
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            const timestamp = Date.now();
            const idProofUrl = await uploadFile(idProof, `kyc/${user.uid}/id_proof_${timestamp}.jpg`);
            const selfieUrl = await uploadFile(selfie, `kyc/${user.uid}/selfie_${timestamp}.jpg`);

            const kycApplicationRef = doc(firestore, 'kycApplications', user.uid);
            await setDoc(kycApplicationRef, {
                userId: user.uid,
                status: 'pending',
                submittedAt: serverTimestamp(),
                aadhaarPanUrl: idProofUrl,
                selfieUrl: selfieUrl,
                bankDetails,
                upiId,
                userName: user.displayName,
                userAvatar: user.photoURL,
            }, { merge: true });

            const userProfileRef = doc(firestore, 'users', user.uid);
            await setDoc(userProfileRef, { kycStatus: 'pending' }, { merge: true });

            toast({
                title: "Success",
                description: "Your KYC documents have been submitted for review."
            });

        } catch (error: any) {
            console.error("KYC Submission Error: ", error);
            toast({
                title: "Submission Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = kycStatus === 'not_submitted' || kycStatus === 'rejected';


  return (
    <div className="space-y-6">
        {bannerImage && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image src={bannerImage.imageUrl} alt={bannerImage.description} fill className="object-cover" data-ai-hint={bannerImage.imageHint} />
            </div>
        )}

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
                            <Input id="id-proof" type="file" required className="file:text-primary" onChange={(e) => handleFileChange(e, setIdProof)} />
                            <p className="text-xs text-muted-foreground">Upload a clear image of the front of your document.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="selfie">Selfie</Label>
                            <Input id="selfie" type="file" required className="file:text-primary" onChange={(e) => handleFileChange(e, setSelfie)} />
                            <p className="text-xs text-muted-foreground">Upload a clear, recent selfie.</p>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-details" className='flex items-center gap-2'><Landmark className='w-4 h-4'/> Bank Account Details</Label>
                            <Textarea name="bank-details" id="bank-details" placeholder="Enter your full name, bank name, account number, and IFSC code." rows={4}/>
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
                            <Input name="upi-id" id="upi-id" placeholder="yourname@upi" />
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
    </div>
  );
}
