
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useUser, useCollection } from "@/firebase";
import type { UserProfile, Transaction } from "@/types";
import { History, ArrowUpCircle, ArrowDownCircle, Gamepad2, Award } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn, formatTimestamp } from "@/lib/utils";

const TransactionIcon = ({ type }: { type: Transaction['type'] }) => {
    switch (type) {
        case 'deposit': return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
        case 'withdrawal': return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
        case 'match-fee': return <Gamepad2 className="h-5 w-5 text-gray-500" />;
        case 'prize': return <Award className="h-5 w-5 text-yellow-500" />;
        default: return <History className="h-5 w-5 text-gray-400" />;
    }
}

const TransactionRow = ({ tx }: { tx: Transaction }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
            <TransactionIcon type={tx.type} />
            <div>
                <p className="font-semibold capitalize">{tx.type.replace('-', ' ')}</p>
                <p className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</p>
            </div>
        </div>
        <p className={cn(
            "font-bold",
            tx.type === 'deposit' || tx.type === 'prize' ? 'text-green-600' : 'text-red-600'
        )}>
            {tx.type === 'deposit' || tx.type === 'prize' ? '+' : '-'}₹{tx.amount.toLocaleString()}
        </p>
    </div>
);


export default function WalletPage() {
    const { userData, loading: userLoading } = useUser();
    const { data: transactions, loading: txLoading } = useCollection<Transaction>(
        `users/${userData?.uid}/transactions`,
        { 
            orderBy: ["timestamp", "desc"],
            limit: 5
        }
    );

    const loading = userLoading || txLoading;

    return (
        <AppShell pageTitle="My Wallet" showBackButton>
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-3">
                
                {/* Left Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm font-light opacity-80">Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {userLoading ? <Skeleton className="h-10 w-36 bg-white/20"/> : <p className="text-4xl font-bold">₹{userData?.walletBalance?.toLocaleString('en-IN') || '0.00'}</p>}
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/add-money">Add Money</Link></Button>
                            <Button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30" asChild><Link href="/withdraw">Withdraw</Link></Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                     <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Here are your last 5 transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading && (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            )}
                            {!loading && transactions && transactions.length > 0 ? (
                                <div className="divide-y">
                                    {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                                </div>
                            ) : (
                                !loading && <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                            <Button asChild variant="secondary" className="w-full">
                                <Link href="/wallet/history">View All Transaction History</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
