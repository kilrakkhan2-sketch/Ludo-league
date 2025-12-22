
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useUser } from "@/firebase";
import type { UserProfile } from "@/types";
import { History } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function WalletPage() {
    const { user, userData, loading } = useUser();
    
    return (
        <AppShell pageTitle="My Wallet" showBackButton>
            <div className="p-4 sm:p-6 space-y-6">
                <Card className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-light opacity-80">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-10 w-36 bg-white/20"/> : <p className="text-4xl font-bold">₹{userData?.walletBalance?.toLocaleString() || '0.00'}</p>}
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/add-money">Add Money</Link></Button>
                        <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/withdraw">Withdraw</Link></Button>
                    </CardFooter>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-full">
                                <History className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>View all your deposits, withdrawals, and game fees.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                            <Button asChild className="w-full">
                            <Link href="/wallet/history">View Full History</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
