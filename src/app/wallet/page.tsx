
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { History, ArrowUpCircle, ArrowDownCircle, Gamepad2, Award, PlusCircle, MinusCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from 'date-fns';

// NOTE: In a real app, you would use the Firebase hooks as you had before.
// For styling consistency and demonstration, we'll use mock data.

const mockUser = {
    walletBalance: 5850.75,
};

const mockTransactions = [
    { id: '1', type: 'prize', amount: 500, timestamp: new Date().toISOString() },
    { id: '2', type: 'match-fee', amount: 100, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', type: 'withdrawal', amount: 1000, timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', type: 'deposit', amount: 2000, timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: '5', type: 'match-fee', amount: 50, timestamp: new Date(Date.now() - 259200000).toISOString() },
];

const TransactionIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'deposit': return <ArrowUpCircle className="h-6 w-6 text-green-400" />;
        case 'withdrawal': return <ArrowDownCircle className="h-6 w-6 text-red-400" />;
        case 'match-fee': return <Gamepad2 className="h-6 w-6 text-yellow-400" />;
        case 'prize': return <Award className="h-6 w-6 text-amber-400" />;
        default: return <History className="h-6 w-6 text-gray-400" />;
    }
}

const TransactionRow = ({ tx }: { tx: any }) => (
    <div className="flex items-center justify-between py-4 transition-colors hover:bg-white/5">
        <div className="flex items-center gap-4">
            <div className="bg-card/50 p-2 rounded-full">
                <TransactionIcon type={tx.type} />
            </div>
            <div>
                <p className="font-bold capitalize">{tx.type.replace('-', ' ')}</p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</p>
            </div>
        </div>
        <p className={cn(
            "font-bold font-mono text-lg",
            tx.type === 'deposit' || tx.type === 'prize' ? 'text-green-400' : 'text-red-400'
        )}>
            {tx.type === 'deposit' || tx.type === 'prize' ? '+' : '-'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
        </p>
    </div>
);

export default function WalletPage() {
    const loading = false; // Set to false to show styled data
    const userData = mockUser;
    const transactions = mockTransactions;

    return (
        <div className="container py-12 md:py-16">
            <div className="text-center mb-10 md:mb-14">
                 <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">Your Wallet</h1>
                <p className="max-w-xl mx-auto mt-3 text-muted-foreground">Manage your funds, view your transactions, and stay in control.</p>
            </div>
           
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card className="bg-gradient-to-br from-green-900 via-gray-900 to-yellow-900 text-primary-foreground border-primary/30 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="font-light opacity-80">Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-12 w-48 bg-white/20"/> : 
                                <p className="text-5xl font-bold font-headline">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(userData.walletBalance)}
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
                </div>

                <div className="lg:col-span-2">
                     <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Recent Activity</CardTitle>
                            <CardDescription>Here are your last 5 transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading && (
                                <div className="space-y-4 pt-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full bg-card" />)}
                                </div>
                            )}
                            {!loading && transactions && transactions.length > 0 ? (
                                <div className="divide-y divide-white/10 -mt-2">
                                    {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
                                </div>
                            ) : (
                                !loading && <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
