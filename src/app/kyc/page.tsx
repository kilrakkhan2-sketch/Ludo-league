
'use client';

import { useState } from "react";
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
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useDoc } from "@/firebase";
import { useFirebase } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { UserProfile, KycRequest } from "@/types";

export default function KycPage() {
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = profile?.isVerified || false;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !fullName || !docType || !docNumber || !docFile) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields and upload your document.",
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const storage = getStorage();
        const docRef = ref(storage, `kyc-documents/${user.uid}/${Date.now()}_${docFile.name}`);
        await uploadBytes(docRef, docFile);
        const documentUrl = await getDownloadURL(docRef);

        await addDoc(collection(firestore, 'kyc-requests'), {
            userId: user.uid,
            fullName,
            documentType: docType,
            documentNumber: docNumber,
            documentUrl,
            status: 'pending',
            createdAt: Timestamp.now(),
        } as Omit<KycRequest, 'id'>);
        
        toast({
            title: "Request Submitted",
            description: "Your KYC documents have been submitted for verification.",
        });
        // Optionally reset form
        setFullName('');
        setDocType('');
        setDocNumber('');
        setDocFile(null);
    } catch (error) {
        console.error("KYC Submission Error:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your documents. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <AppShell>
      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              KYC Verification
            </h1>
            <p className="text-muted-foreground">
              Verify your identity to unlock all platform features.
            </p>
          </div>
        </div>

        {isVerified ? (
          <Alert className="bg-success/10 border-success/20">
            <ShieldCheck className="h-4 w-4 text-success" />
            <AlertTitle className="text-success font-bold">You are verified!</AlertTitle>
            <AlertDescription className="text-success/80">
              Your identity has been successfully verified. You now have access
              to all features, including higher withdrawal limits.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Documents</CardTitle>
              <CardDescription>
                Please provide the following information and documents for
                verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    placeholder="As it appears on your ID"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select value={docType} onValueChange={setDocType} required>
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="pan">PAN Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">
                        Driver's License
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-number">Document Number</Label>
                  <Input
                    id="document-number"
                    placeholder="Enter document ID number"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-upload">Upload Document</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="document-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                        {docFile ? (
                           <p className="text-sm font-semibold text-primary">{docFile.name}</p>
                        ) : (
                          <>
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG or PDF (MAX. 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <Input id="document-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
                    </label>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit for Verification"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
