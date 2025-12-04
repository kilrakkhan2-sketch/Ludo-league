
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useCollection, useUser } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { doc, writeBatch, serverTimestamp, getDoc, runTransaction } from "firebase/firestore";
import type { DepositRequest, UserProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Link from "next/link";
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDepositsPage() {
  const { data: pending, loading: pendingLoading, hasMore: hasMorePending, loadMore: loadMorePending } = useCollection<DepositRequest>('deposit-requests', { where: ['status', '==', 'pending'], orderBy: ['createdAt', 'asc'], limit: 10 });
  const { data: approved, loading: approvedLoading, hasMore: hasMoreApproved, loadMore: loadMoreApproved } = useCollection<DepositRequest>('deposit-requests', { where: ['status', '==', 'approved'], orderBy: ['createdAt', 'desc'], limit: 5 });
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const handleUpdateRequest = async (deposit: DepositRequest, newStatus: 'approved' | 'rejected') => {
    if (!firestore) return;

    setUpdating(prev => ({...prev, [deposit.id]: true}));
    
    try {
      if (newStatus === 'approved') {
        // Use a transaction for atomic update
        await runTransaction(firestore, async (transaction) => {
          const userRef = doc(firestore, 'users', deposit.userId);
          const depositRef = doc(firestore, 'deposit-requests', deposit.id);
          const transactionRef = doc(firestore, `users/${deposit.userId}/transactions`, `deposit_${deposit.id}`);

          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw "User not found!";
          }

          const newBalance = userDoc.data().walletBalance + deposit.amount;
          
          transaction.update(userRef, { walletBalance: newBalance });
          transaction.update(depositRef, { status: newStatus });
          transaction.set(transactionRef, {
            userId: deposit.userId,
            userName: userDoc.data().name,
            userEmail: userDoc.data().email,
            type: 'deposit',
            amount: deposit.amount,
            status: 'completed',
            createdAt: serverTimestamp(),
            relatedId: deposit.id,
          });
        });
      } else { // For rejection, a simple batch write is fine
        const batch = writeBatch(firestore);
        const depositRef = doc(firestore, 'deposit-requests', deposit.id);
        batch.update(depositRef, { status: newStatus });
        await batch.commit();
      }

      toast({
        title: "Success",
        description: `Deposit request has been ${newStatus}.`,
      });
    } catch (serverError: any) {
        console.error(serverError);
        const permissionError = new FirestorePermissionError({
          path: `/deposit-requests/${deposit.id}`,
          operation: 'update',
          requestResourceData: { status: newStatus },
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setUpdating(prev => ({...prev, [deposit.id]: false}));
    }
  };
  
  const TableSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Deposit Requests</h1>
       <Card>
        <CardHeader>
          <CardTitle>Pending Deposits</CardTitle>
          <CardDescription>
            Verify and approve or reject deposit requests. Approving a request will automatically update the user's balance and create a transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingLoading && pending.length === 0 ? <TableSkeleton /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length > 0 ? pending.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'dd MMM yyyy, HH:mm') : 'Just now'}</TableCell>
                    <TableCell>
                        <div>{req.userName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{req.userId}</div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{req.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{req.transactionId}</TableCell>
                    <TableCell>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link href={req.screenshotURL} target="_blank" rel="noopener noreferrer">View</Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-success border-success hover:bg-success/10 hover:text-success"
                          onClick={() => handleUpdateRequest(req, 'approved')}
                          disabled={updating[req.id]}
                        >
                          {updating[req.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                       </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUpdateRequest(req, 'rejected')}
                          disabled={updating[req.id]}
                        >
                          {updating[req.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                       </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No pending deposit requests.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {hasMorePending && (
             <div className="pt-4 flex justify-center">
                <Button onClick={loadMorePending} disabled={pendingLoading}>
                    {pendingLoading ? 'Loading...' : 'Load More'}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Approved Deposits</CardTitle>
        </CardHeader>
        <CardContent>
           {approvedLoading && approved.length === 0 ? <TableSkeleton /> : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {approved.map(req => (
                        <TableRow key={req.id}>
                             <TableCell>{req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'dd MMM yyyy') : 'Just now'}</TableCell>
                             <TableCell>
                                <div>{req.userName}</div>
                                <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                            </TableCell>
                             <TableCell>₹{req.amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
           )}
            {hasMoreApproved && (
                <div className="pt-4 flex justify-center">
                    <Button onClick={loadMoreApproved} disabled={approvedLoading}>
                        {approvedLoading ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
