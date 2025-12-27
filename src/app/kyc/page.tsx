
'use client';

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useDoc } from "@/firebase";
import { useFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, Timestamp, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserProfile, KycRequest } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function KycPage() {
  const { user } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPending = async () => {
      if (!user || !firestore) return;
      const q = query(collection(firestore, "kyc-requests"), where("userId", "==", user.uid), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      setHasPendingRequest(!querySnapshot.empty);
    };
    if (user) {
      checkPending();
    }
  }, [user, firestore]);

  const isVerified = profile?.isVerified || false;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !fullName || !docType || !docNumber || !docFile) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields and upload your document." });
        return;
    }

    setIsSubmitting(true);
    try {
        const storage = getStorage();
        const safeFileName = `kyc_${Date.now()}_${docFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const docRef = ref(storage, `kyc-documents/${user.uid}/${safeFileName}`);
        
        await uploadBytes(docRef, docFile);
        const documentUrl = await getDownloadURL(docRef);

        await addDoc(collection(firestore, 'kyc-requests'), {
            userId: user.uid,
            fullName,
            documentType: docType,
            documentNumber: docNumber,
            documentFrontImage: documentUrl,
            status: 'pending',
            createdAt: Timestamp.now(),
        } as Omit<KycRequest, 'id'>);
        
        toast({ title: "Request Submitted", description: "Your KYC documents have been submitted for verification." });
        setHasPendingRequest(true);
    } catch (error: any) {
        console.error("KYC Submission Error:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: error.message || "There was an error submitting your documents." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (profileLoading || hasPendingRequest === null) {
      return (
        <Card className="w-full">
          <CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      );
    }
    
    if (isVerified) {
      return (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300 font-bold">You are Verified!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400/80">
              Your identity has been successfully verified. You have full access to all features.
            </AlertDescription>
          </Alert>
      );
    }
    
    if (hasPendingRequest) {
       return (
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-bold">Verification Pending</AlertTitle>
            <AlertDescription>
              Your documents are under review. We will notify you once the process is complete.
            </AlertDescription>
          </Alert>
       );
    }

    return (
        <Card className="w-full">
            <CardHeader>
              <CardTitle>KYC Verification</CardTitle>
              <CardDescription>Submit your documents to unlock higher withdrawal limits and features.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="As it appears on your ID" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                {/* Responsive Grid for document fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select value={docType} onValueChange={setDocType} required>
                        <SelectTrigger id="document-type"><SelectValue placeholder="Select a document" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aadhaar_card">Aadhaar Card</SelectItem>
                          <SelectItem value="pan_card">PAN Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-number">Document Number</Label>
                      <Input id="document-number" placeholder="Enter document ID" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-upload">Upload Document</Label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="document-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        {docFile ? (
                           <p className="font-semibold text-primary break-all px-2">{docFile.name}</p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <Input id="document-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
                    </label>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit for Verification"}</Button>
              </form>
            </CardContent>
          </Card>
    );
  };

  return (
    <AppShell pageTitle="KYC Verification" showBackButton>
      {/* Centered and max-width container for content */}
      <div className="flex justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
            {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}
