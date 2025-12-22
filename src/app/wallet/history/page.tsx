
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { useUser, useCollection } from "@/firebase";
import type { Transaction } from "@/types";
import { ArrowDown, ArrowUp, Ticket, Trophy, Minus, Gift } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from '@/components/ui/skeleton';
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
             return <div className="p-2 bg-blue-500/10 rounded-full"><Gift className="h-5 w-5 text-blue-500" /></div>;
        default:
            return <div className="p-2 bg-gray-100 rounded-full"><Minus className="h-5 w-5" /></div>;
    }
}

export default function TransactionHistoryPage() {
    const { user } = useUser();
    
    const queryOptions = useMemo(() => ({
        orderBy: [['createdAt', 'desc'] as const],
        limit: 100, // Fetch up to 100 recent transactions
    }), []);

    const { data: transactions, loading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : '', 
        queryOptions
    );
    
    return (
        <AppShell pageTitle="Transaction History" showBackButton>
            <div className="p-4 sm:p-6 space-y-3">
                 {loading ? (
                     [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)
                 ) : transactions.length > 0 ? (
                   transactions.map(tx => {
                       const isCredit = tx.amount > 0 || tx.type === 'deposit' || tx.type === 'prize' || tx.type === 'referral_bonus' || tx.type === 'win' || tx.type === 'add_money';
                       const amount = tx.type === 'entry_fee' ? Math.abs(tx.amount) : tx.amount;

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
                                        {isCredit ? '+' : '-'}₹{Math.abs(amount).toLocaleString()}
                                    </p>
                                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="capitalize mt-1">{tx.status}</Badge>
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
        </AppShell>
    );
}
