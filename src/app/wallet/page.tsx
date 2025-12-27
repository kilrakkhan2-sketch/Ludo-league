
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowUpCircle, ArrowDownCircle, Gamepad2, Award, PlusCircle, MinusCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useUser, useCollection } from "@/firebase";
import type { Transaction } from "@/types";

const TransactionIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'deposit': return <ArrowUpCircle className="h-6 w-6 text-green-400" />;
        case 'withdrawal': return <ArrowDownCircle className="h-6 w-6 text-red-400" />;
        case 'entry_fee': return <Gamepad2 className="h-6 w-6 text-yellow-400" />;
        case 'prize': return <Award className="h-6 w-6 text-amber-400" />;
        default: return <History className="h-6 w-6 text-gray-400" />;
    }
}

const TransactionRow = ({ tx }: { tx: Transaction }) => {
    const isCredit = tx.amount > 0;
    return (
        <div className="flex items-center justify-between py-4 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-4">
                <div className="bg-card/50 p-2 rounded-full">
                    <TransactionIcon type={tx.type} />
                </div>
                <div>
                    <p className="font-bold capitalize">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{tx.createdAt?.seconds ? formatDistanceToNow(new Date(tx.createdAt.seconds * 1000), { addSuffix: true }) : ''}</p>
                </div>
            </div>
            <p className={cn(
                "font-bold font-mono text-lg",
                isCredit ? 'text-green-400' : 'text-red-400'
            )}>
                {isCredit ? '+' : '-'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(tx.amount))}
            </p>
        </div>
    )
};

export default function WalletPage() {
    const { user, userData, loading } = useUser();
    const { data: transactions, loading: txLoading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : undefined,
        { orderBy: ['createdAt', 'desc'], limit: 5 }
    );

    return (
        <AppShell pageTitle="My Wallet">
            <div className="p-4 sm:p-6 space-y-8">
                <Card className="bg-gradient-to-br from-green-900 via-gray-900 to-yellow-900 text-primary-foreground border-primary/30 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-light opacity-80">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-12 w-48 bg-white/20"/> : 
                            <p className="text-5xl font-bold font-headline">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(userData?.walletBalance || 0)}
                            </p>
                        }
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-4">
                        <Button size="lg" asChild className="bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/20 backdrop-blur-sm">
                            <Link href="/add-money"><PlusCircle className="mr-2 h-5 w-5"/> Add Funds</Link>
                        </Button>
                        <Button size="lg" asChild className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 backdrop-blur-sm">
                            <Link href="/withdraw"><MinusCircle className="mr-2 h-5 w-5"/> Withdraw</Link>
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                    <CardHeader>
                            <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <CardTitle className="font-headline text-2xl">Recent Activity</CardTitle>
                                <CardDescription>Here are your latest transactions.</CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/wallet/history">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(loading || txLoading) && (
                            <div className="space-y-4 pt-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full bg-card" />)}
                            </div>
                        )}
                        {!(loading || txLoading) && transactions && transactions.length > 0 ? (
                            <div className="divide-y divide-white/10 -mt-2">
                                {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                            </div>
                        ) : (
                            !(loading || txLoading) && <p className="text-center text-muted-foreground py-8">No recent transactions.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
