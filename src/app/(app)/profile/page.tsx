'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { BarChart, Edit, Mail, Phone, User as UserIcon, Wallet, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

const KycStatusCard = ({ kycStatus, rejectionReason }: { kycStatus: string, rejectionReason?: string }) => {
    const statusConfig = {
        verified: {
            icon: <CheckCircle className="h-12 w-12 text-green-500" />,
            title: "KYC Verified",
            description: "Your account is fully verified. You can now make withdrawals.",
            button: <Button asChild><Link href="/wallet">Withdraw Funds</Link></Button>
        },
        pending: {
            icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
            title: "KYC Pending",
            description: "Your KYC documents are under review. This usually takes 24-48 hours.",
            button: <Button disabled>Verification in Progress</Button>
        },
        rejected: {
            icon: <XCircle className="h-12 w-12 text-red-500" />,
            title: "KYC Rejected",
            description: `Your KYC verification was rejected. Reason: ${rejectionReason || 'Not provided'}`,
            button: <Button asChild><Link href="/kyc">Resubmit KYC</Link></Button>
        },
        not_submitted: {
            icon: <ShieldCheck className="h-12 w-12 text-muted-foreground" />,
            title: "KYC Verification",
            description: "Please submit your KYC documents to enable withdrawals.",
            button: <Button asChild><Link href="/kyc">Submit KYC</Link></Button>
        }
    };

    const currentStatus = statusConfig[kycStatus as keyof typeof statusConfig] || statusConfig.not_submitted;

    return (
        <Card className="shadow-md bg-card">
            <CardHeader className="text-center">
                <div className="mx-auto bg-muted/20 p-3 rounded-full">{currentStatus.icon}</div>
                <CardTitle className="mt-4">{currentStatus.title}</CardTitle>
                <CardDescription className="mt-2">{currentStatus.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                {currentStatus.button}
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
  const { user, userProfile } = useUser();

  if (!user || !userProfile) {
    return <div className="flex items-center justify-center h-full"><p>Loading profile...</p></div>;
  }

  return (
    <div className="grid gap-8">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col items-center text-center gap-4">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
            <AvatarFallback className="text-3xl">{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-2xl">{user.displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
           <Button variant="outline" size="sm" className="mt-2">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="mt-4 border-t pt-6 grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <UserIcon className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-semibold text-sm break-all">{user.uid}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Wallet className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Total Winnings</p>
                    <p className="font-semibold">₹{userProfile.winnings || 0}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <BarChart className="h-6 w-6 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="font-semibold">{userProfile.winRate || 0}%</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <KycStatusCard kycStatus={userProfile.kycStatus || 'not_submitted'} rejectionReason={userProfile.kycRejectionReason} />
      
    </div>
  );
}
