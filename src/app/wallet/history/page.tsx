
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { useCollection, useUser } from "@/firebase";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Ticket,
  CircleArrowUp,
  CircleArrowDown,
  Download,
} from "lucide-react";

const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
        case 'prize':
        case 'win':
            return <Trophy className="h-5 w-5" />;
        case 'entry_fee':
            return <Ticket className="h-5 w-5" />;
        case 'withdrawal':
            return <CircleArrowUp className="h-5 w-5" />;
        case 'deposit':
        case 'add_money':
            return <CircleArrowDown className="h-5 w-5" />;
        default:
            return <Download className="h-5 w-5" />;
    }
}

const TransactionSkeleton = () => (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
        <Skeleton className="h-6 w-16" />
    </div>
)

export default function WalletHistoryPage() {
    const { user } = useUser();
    const { data: transactions, loading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : '',
        { orderBy: ['createdAt', 'desc'] }
    );

    return (
        <AppShell pageTitle="Transaction History" showBackButton>
            <div className="p-4 space-y-4">
                {loading ? (
                    <>
                        <TransactionSkeleton />
                        <TransactionSkeleton />
                        <TransactionSkeleton />
                        <TransactionSkeleton />
                    </>
                ) : transactions.length > 0 ? (
                    transactions.map((tx: Transaction) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-full", tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                                    {getTransactionIcon(tx.type)}
                                </div>
                                <div>
                                    <p className="font-semibold capitalize">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-muted-foreground">{tx.createdAt ? format(tx.createdAt.toDate(), 'dd MMM yyyy, hh:mm a') : 'N/A'}</p>
                                </div>
                            </div>
                            <p className={cn("font-bold text-lg", tx.amount > 0 ? "text-green-600" : "text-red-600")}>
                                {tx.amount > 0 ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-muted-foreground bg-card rounded-lg">
                        <p>No transactions yet.</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
