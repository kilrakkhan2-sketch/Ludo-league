
'use client';

import { AdminShell } from "@/components/layout/AdminShell";
import { useCollection } from "@/firebase";
import type { Transaction } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTransactionsPage() {
  const { data: transactions, loading, hasMore, loadMore } = useCollection<Transaction>('transactions', { 
    orderBy: ['createdAt', 'desc'], 
    limit: 20, 
    isCollectionGroup: true 
  });

  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-12" /></TableCell>
    </TableRow>
  )

  return (
    <AdminShell>
        <div>
            <h1 class="text-3xl font-bold font-headline">All Transactions</h1>
            <p class="text-muted-foreground">A complete history of all transactions on the platform.</p>
        </div>
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
          {loading && transactions.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                <div className="font-medium">{tx.userName || tx.userId.substring(0, 6)}</div>
                <div className="hidden text-sm text-muted-foreground md:inline">{tx.userEmail}</div>
              </TableCell>
              <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
              <TableCell>
                {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy, hh:mm a') : 'N/A'}
              </TableCell>
              <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}₹{tx.amount.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMore && (
        <div className="flex justify-center">
            <Button onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
            </Button>
        </div>
      )}
    </AdminShell>
  );
}
