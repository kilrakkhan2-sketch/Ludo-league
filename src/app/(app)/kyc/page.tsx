
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, FileUp, Loader2, Landmark, AtSign } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import imageCompression from 'browser-image-compression';
import { KycStatusIndicator } from '@/components/app/kyc-status-indicator';

const bannerImage = PlaceHolderImages.find(img => img.id === 'kyc-banner');

export default function KycPage() {
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idProof, setIdProof] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    const kycStatus = userProfile?.kycStatus || 'not_submitted';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };
    
    const compressAndUploadFile = async (file: File, path: string): Promise<string> => {
        const storage = getStorage();
        const storageRef = ref(storage, path);
        
        const options = {
            maxSizeMB: 0.5, // Compress to max 500KB
            maxWidthOrHeight: 1280,
            useWebWorker: true,
        };
        
        try {
            toast({ title: 'Compressing image...', description: 'Please wait.' });
            const compressedFile = await imageCompression(file, options);

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
                reader.readAsDataURL(compressedFile);
            });
        } catch (error) {
            console.error('Image compression failed:', error);
            toast({ title: 'Compression failed', description: 'Trying to upload original image.', variant: 'destructive'});
            // Fallback to uploading original file
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
        }
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
            const fullName = formData.get('fullName') as string;
            const dateOfBirth = formData.get('dateOfBirth') as string;
            const aadhaarNumber = formData.get('aadhaarNumber') as string;
            const panNumber = formData.get('panNumber') as string;
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
            const idProofUrl = await compressAndUploadFile(idProof, `kyc/${user.uid}/id_proof_${timestamp}.jpg`);
            const selfieUrl = await compressAndUploadFile(selfie, `kyc/${user.uid}/selfie_${timestamp}.jpg`);

            const kycApplicationRef = doc(firestore, 'kycApplications', user.uid);
            await setDoc(kycApplicationRef, {
                userId: user.uid,
                status: 'pending',
                submittedAt: serverTimestamp(),
                aadhaarPanUrl: idProofUrl,
                selfieUrl: selfieUrl,
                fullName,
                dateOfBirth,
                aadhaarNumber,
                panNumber,
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
        <KycStatusIndicator />

        {canSubmit && (
            <Card>
            <CardHeader>
                <CardTitle>Submit Documents & Bank Details</CardTitle>
                <CardDescription>
                    Upload your documents and provide payment details. Withdrawals will only be processed to the verified Bank Account or UPI ID.
                </CardDescription>
            </CardHeader>
            <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name (as per ID)</Label>
                                <Input id="fullName" name="fullName" required placeholder="Enter your full name" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                                <Input id="aadhaarNumber" name="aadhaarNumber" placeholder="Enter 12-digit Aadhaar number" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="panNumber">PAN Number</Label>
                                <Input id="panNumber" name="panNumber" placeholder="Enter 10-digit PAN number" />
                            </div>
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
            </Card>
        )}
      </div>
    </div>
  );
}
