
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, Transaction, AppSettings, WithdrawalRequest } from "@/types";
import { format } from "date-fns";
import { useFirebase } from "@/firebase/provider";
import { addDoc, collection, runTransaction, doc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletPage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(user ? `users/${user.uid}/transactions` : '', { orderBy: ['createdAt', 'desc'], limit: 10 });
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('upi');
  const [withdrawalDetails, setWithdrawalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestWithdrawal = async () => {
    if (!firestore || !user || !profile) return;
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
      return;
    }
    if (amount > (profile.walletBalance || 0)) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'You cannot withdraw more than your available balance.' });
      return;
    }
    if (!withdrawalDetails) {
      toast({ variant: 'destructive', title: 'Missing Details', description: 'Please provide your withdrawal details (UPI ID or Bank Account).' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use a transaction to ensure atomicity
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || (userDoc.data().walletBalance || 0) < amount) {
          throw new Error('Insufficient balance.');
        }

        // Deduct from user's balance immediately
        const newBalance = userDoc.data().walletBalance - amount;
        transaction.update(userRef, { walletBalance: newBalance });

        // Create a withdrawal request for admin approval
        const withdrawalRef = doc(collection(firestore, 'withdrawal-requests'));
        transaction.set(withdrawalRef, {
          userId: user.uid,
          userName: profile.name,
          userEmail: profile.email,
          amount,
          method: withdrawalMethod,
          details: withdrawalDetails,
          status: 'pending',
          createdAt: Timestamp.now(),
        });
        
        // Create a pending transaction record
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        transaction.set(transactionRef, {
            amount: -amount,
            type: 'withdrawal',
            status: 'pending',
            description: `Withdrawal request to ${withdrawalDetails}`,
            relatedId: withdrawalRef.id,
            createdAt: Timestamp.now()
        });
      });

      toast({ title: 'Withdrawal Request Submitted', description: 'Your request is being processed.' });
      setWithdrawalAmount('');
      setWithdrawalDetails('');
      // Close dialog if it's open - requires state management for dialog
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Request Failed', description: error.message || 'Could not submit withdrawal request.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const loading = userLoading || profileLoading || transactionsLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">My Wallet</h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Available balance for playing</CardDescription>
            </div>
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                 <Skeleton className="h-12 w-48" />
            ): (
                 <p className="text-5xl font-bold">
                    ₹{profile?.walletBalance?.toLocaleString() ?? 0}
                </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" onClick={() => router.push('/add-money')}>
              <Upload className="mr-2 h-4 w-4" /> Deposit
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex-1">
                  <Download className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Withdrawal</DialogTitle>
                  <DialogDescription>
                    Withdrawal requests are processed within 24 hours.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-amount">Amount (₹)</Label>
                    <Input id="withdrawal-amount" type="number" placeholder={`Available: ₹${profile?.walletBalance || 0}`} value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-details">UPI ID / Bank Account</Label>
                    <Input id="withdrawal-details" placeholder="e.g., yourname@upi or bank details" value={withdrawalDetails} onChange={(e) => setWithdrawalDetails(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleRequestWithdrawal} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent wallet activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">Loading transactions...</TableCell>
                    </TableRow>
                ) : transactions.length > 0 ? (
                  transactions.map((tx: Transaction) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? (
                            <div className="p-1.5 bg-success/20 rounded-full">
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-destructive/20 rounded-full">
                              <ArrowDownLeft className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                          <span className="font-medium capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                       <TableCell>{tx.createdAt ? format(tx.createdAt.toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={"outline"}
                          className={cn(
                            "font-medium capitalize",
                            tx.status === "completed" && "bg-success/20 text-success border-success/20",
                            tx.status === "pending" && "bg-warning/20 text-warning border-warning/20",
                            tx.status === "failed" && "bg-destructive/20 text-destructive border-destructive/20"
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          tx.amount > 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No transactions yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
