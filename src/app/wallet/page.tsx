
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useUser, useCollection } from "@/firebase";
import type { UserProfile, Transaction } from "@/types";
import { ArrowDown, ArrowUp, Plus, Minus, Ticket, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
        case 'deposit':
        case 'add_money':
            return <div className="p-2 bg-green-500/10 rounded-full"><ArrowDown className="h-5 w-5 text-green-500" /></div>;
        case 'withdrawal':
            return <div className="p-2 bg-red-500/10 rounded-full"><ArrowUp className="h-5 w-5 text-red-500" /></div>;
        case 'entry_fee':
            return <div className="p-2 bg-gray-500/10 rounded-full"><Ticket className="h-5 w-5 text-gray-500" /></div>;
        case 'prize':
        case 'win':
            return <div className="p-2 bg-yellow-500/10 rounded-full"><Trophy className="h-5 w-5 text-yellow-500" /></div>;
        case 'referral_bonus':
             return <div className="p-2 bg-blue-500/10 rounded-full"><Trophy className="h-5 w-5 text-blue-500" /></div>;
        default:
            return <div className="p-2 bg-gray-100 rounded-full"><Minus className="h-5 w-5" /></div>;
    }
}

export default function WalletPage() {
    const { user } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");

    const queryOptions = useMemo(() => ({
        where: user ? [['userId', '==', user.uid] as const] : undefined,
        orderBy: [['createdAt', 'desc'] as const],
        limit: 50,
    }), [user]);

    const { data: transactions, loading: txLoading } = useCollection<Transaction>(`users/${user?.uid}/transactions`, queryOptions);
    
    const loading = profileLoading || txLoading;
    
    return (
        <AppShell pageTitle="My Wallet" showBackButton>
            <div className="p-4 sm:p-6 space-y-6">
                <Card className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-sm font-light opacity-80">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-10 w-36 bg-white/20"/> : <p className="text-4xl font-bold">₹{profile?.walletBalance?.toLocaleString() || '0.00'}</p>}
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/add-money">Add Money</Link></Button>
                        <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/withdraw">Withdraw</Link></Button>
                    </CardFooter>
                </Card>

                <div>
                    <h3 className="text-lg font-bold mb-3">Transaction History</h3>
                    <div className="space-y-3">
                        {loading ? (
                             [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)
                        ) : transactions.length > 0 ? (
                           transactions.map(tx => {
                               const isCredit = tx.amount > 0;
                               return (
                                    <div key={tx.id} className="flex items-center gap-4 p-3 bg-card rounded-lg shadow-sm border">
                                        {getTransactionIcon(tx.type)}
                                        <div className="flex-grow">
                                            <p className="font-semibold capitalize">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                             <p className={`font-bold ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                                {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                                            </p>
                                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">{tx.status}</Badge>
                                        </div>
                                    </div>
                               )
                           })
                        ) : (
                            <p className="text-center text-muted-foreground pt-8">No transactions yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
