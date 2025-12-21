
'use client';

import { useCollection, useCollectionGroup } from "@/firebase";
import type { Transaction, UserProfile } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTransactionsPage() {
  const { data: transactions, loading: txLoading } = useCollectionGroup<Transaction>('transactions', { 
    orderBy: ['createdAt', 'desc'], 
    limit: 50, 
  });
  
  const userIds = useMemo(() => {
    if (!transactions || transactions.length === 0) return ['_']; // Firestore 'in' query needs a non-empty array
    const ids = new Set(transactions.map((tx: Transaction) => tx.userId));
    return ids.size > 0 ? Array.from(ids) : ['_'];
  }, [transactions]);
  
  const usersQueryOptions = useMemo(() => ({
    where: ['uid', 'in', userIds]
  }), [userIds]);

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users', usersQueryOptions);
  
  const usersMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map((u: UserProfile) => [u.uid, u]));
  }, [users]);

  const loading = txLoading || (usersLoading && transactions.length > 0);

  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">All Transactions</h1>
            <p className="text-muted-foreground">A complete history of all transactions on the platform.</p>
        </div>
      <Card>
        <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    </>
                ) : transactions.length > 0 ? (
                  transactions.map((tx: Transaction) => {
                    const user = usersMap.get(tx.userId);
                    return (
                    <TableRow key={tx.id}>
                    <TableCell>
                        <div className="font-medium">{user?.displayName || tx.userName || tx.userId.substring(0, 6)}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">{user?.email || tx.userEmail}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                    <TableCell>
                        {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}₹{tx.amount.toLocaleString()}
                    </TableCell>
                    </TableRow>
                )})
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No transactions found.</TableCell>
                  </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
