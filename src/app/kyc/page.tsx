
'use client';

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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const kycCardImage = PlaceHolderImages.find((p) => p.id === "kyc_card");

export default function KycPage() {
  const isVerified = false; // Mock state for demonstration

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
            <CardContent className="grid md:grid-cols-2 gap-8">
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    placeholder="As it appears on your ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select>
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">
                        Driver&apos;s License
                      </SelectItem>
                      <SelectItem value="national_id">
                        National ID Card
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-number">Document Number</Label>
                  <Input
                    id="document-number"
                    placeholder="Enter document ID number"
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
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG or PDF (MAX. 5MB)
                        </p>
                      </div>
                      <Input id="document-upload" type="file" className="hidden" />
                    </label>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Submit for Verification
                </Button>
              </form>
              <div className="hidden md:flex items-center justify-center rounded-lg bg-muted p-4">
                {kycCardImage ? (
                  <Image
                    src={kycCardImage.imageUrl}
                    alt={kycCardImage.description}
                    data-ai-hint={kycCardImage.imageHint}
                    width={400}
                    height={250}
                    className="rounded-md object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShieldCheck className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
