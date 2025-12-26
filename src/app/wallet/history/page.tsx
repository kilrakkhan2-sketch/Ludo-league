
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { useUser, useCollection } from "@/firebase";
import type { Transaction } from "@/types";
import { ArrowDown, ArrowUp, Ticket, Trophy, Minus, Gift, PlusCircle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
        case 'deposit':
        case 'add_money':
            return <div className="p-3 bg-green-500/10 rounded-full"><ArrowDown className="h-5 w-5 text-green-500" /></div>;
        case 'withdrawal':
        case 'withdrawal_refund':
            return <div className="p-3 bg-red-500/10 rounded-full"><ArrowUp className="h-5 w-5 text-red-500" /></div>;
        case 'entry_fee':
        case 'entry_fee_refund':
            return <div className="p-3 bg-gray-500/10 rounded-full"><Ticket className="h-5 w-5 text-gray-500" /></div>;
        case 'prize':
        case 'win':
            return <div className="p-3 bg-yellow-500/10 rounded-full"><Trophy className="h-5 w-5 text-yellow-500" /></div>;
        case 'referral_bonus':
             return <div className="p-3 bg-blue-500/10 rounded-full"><Gift className="h-5 w-5 text-blue-500" /></div>;
        default:
            return <div className="p-3 bg-gray-100 rounded-full"><Minus className="h-5 w-5" /></div>;
    }
}

export default function TransactionHistoryPage() {
    const { user, userData, loading: userLoading } = useUser();
    
    const queryOptions = useMemo(() => ({
        orderBy: [['createdAt', 'desc'] as const],
        limit: 100, // Fetch up to 100 recent transactions
    }), []);

    const { data: transactions, loading: txLoading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : undefined, 
        queryOptions
    );
    
    const loading = userLoading || txLoading;
    
    return (
        <AppShell pageTitle="Transaction History" showBackButton>
            <div className="p-4 sm:p-6 space-y-6">
                <Card className="bg-gradient-to-br from-primary/10 to-card">
                    <CardHeader>
                        <CardTitle className="font-light opacity-80 text-muted-foreground">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-12 w-48 bg-muted"/> : 
                            <p className="text-5xl font-bold font-headline text-foreground">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(userData?.walletBalance || 0)}
                            </p>
                        }
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-4">
                        <Button size="lg" asChild>
                            <Link href="/add-money"><PlusCircle className="mr-2 h-5 w-5"/> Add Funds</Link>
                        </Button>
                        <Button size="lg" asChild variant="secondary">
                            <Link href="/withdraw"><MinusCircle className="mr-2 h-5 w-5"/> Withdraw</Link>
                        </Button>
                    </CardFooter>
                </Card>

                 <h3 className="text-lg font-semibold pt-4">Full History</h3>
                 <div className="space-y-3">
                     {loading ? (
                         [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)
                     ) : transactions && transactions.length > 0 ? (
                       transactions.map(tx => {
                           const isCredit = tx.amount > 0;
                           return (
                                <div key={tx.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-3 bg-card rounded-lg shadow-sm border">
                                    {getTransactionIcon(tx.type)}
                                    <div className="overflow-hidden">
                                        <p className="font-semibold capitalize truncate">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                         <p className={cn(
                                             "font-bold text-base",
                                             isCredit ? 'text-green-500' : 'text-red-500'
                                          )}>
                                            {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                                        </p>
                                        <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize mt-1">{tx.status}</Badge>
                                    </div>
                                </div>
                           )
                       })
                    ) : (
                        <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-semibold text-foreground">No Transactions Found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your transaction history is empty. Play a match or add money to get started.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

    