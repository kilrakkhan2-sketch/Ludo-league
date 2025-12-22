
'use client';

import { useCollection, useCollectionGroup } from "@/firebase";
import type { Transaction, UserProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CircleArrowDown, CircleArrowUp, Ticket, Trophy } from "lucide-react";

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
            return <CircleArrowDown className="h-5 w-5" />;
    }
}

export default function AdminTransactionsPage() {
  const { data: transactions, loading: txLoading } = useCollectionGroup<Transaction>('transactions', { 
    orderBy: ['createdAt', 'desc'], 
    limit: 50, 
  });
  
  const userIds = useMemo(() => {
    if (!transactions || transactions.length === 0) return ['_'];
    const ids = new Set(transactions.map((tx: Transaction) => tx.userId));
    return ids.size > 0 ? Array.from(ids) : ['_'];
  }, [transactions]);
  
  const usersQueryOptions = useMemo(() => ({
    where: ['uid', 'in', userIds] as const
  }), [userIds]);

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users', usersQueryOptions);
  
  const usersMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map((u: UserProfile) => [u.uid, u]));
  }, [users]);

  const loading = txLoading || (usersLoading && transactions.length > 0);

  const SkeletonCard = () => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-48" />
        </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">All Transactions</h1>
            <p className="text-muted-foreground">A complete history of all transactions on the platform.</p>
        </div>
        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
             </div>
        ) : transactions.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transactions.map((tx: Transaction) => {
                    const user = usersMap.get(tx.userId);
                    const isCredit = tx.amount > 0;
                    return (
                        <Card key={tx.id}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div className={`text-xl font-bold ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                        {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                                    </div>
                                    <Badge variant="outline">{tx.type.replace(/_/g, ' ')}</Badge>
                                </div>
                            </CardHeader>
                             <CardContent className="space-y-1">
                                <p className="font-semibold">{user?.displayName || tx.userName || 'Unknown User'}</p>
                                <p className="text-sm text-muted-foreground">{tx.description || 'Transaction'}</p>
                                <p className="text-xs text-muted-foreground pt-2">
                                     {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
             </div>
        ) : (
             <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found.</p>
            </div>
        )}
    </div>
  );
}
