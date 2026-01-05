'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Loader2 } from "lucide-react";
import { doc, onSnapshot } from 'firebase/firestore';

export default function ReferralsPage() {
    const { userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [commission, setCommission] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const configRef = doc(firestore, 'referralConfiguration', 'settings');
        const unsubscribe = onSnapshot(configRef, (doc) => {
          if (doc.exists()) {
            setCommission(doc.data().commissionPercentage);
          }
          setLoading(false);
        });
        return () => unsubscribe();
    }, [firestore]);

    const handleCopyCode = () => {
        if (userProfile?.referralCode) {
            navigator.clipboard.writeText(userProfile.referralCode);
            toast({
                title: "Referral Code Copied!",
                description: "You can now share it with your friends.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Refer & Earn</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Invite Friends, Earn Rewards!</CardTitle>
                    <CardDescription>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : commission ? (
                            `Share your referral code with friends. When they make their first deposit, you'll earn a ${commission}% commission!`
                        ) : (
                            'Share your referral code with friends to earn rewards!'
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Your Unique Referral Code</p>
                        <div className="flex items-center gap-4 mt-2">
                            {userProfile?.referralCode ? (
                                <>
                                    <div className="flex-grow p-3 bg-muted/50 rounded-lg border">
                                        <p className="text-2xl font-bold tracking-widest text-center text-primary font-mono">{userProfile.referralCode}</p>
                                    </div>
                                    <Button onClick={handleCopyCode} variant="outline" size="icon">
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex-grow p-3 bg-muted/50 rounded-lg border flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin"/>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
