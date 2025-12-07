
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
  Download,
  Upload,
  Trophy,
  Ticket,
  CircleArrowUp,
  CircleArrowDown,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, Transaction } from "@/types";
import { format } from "date-fns";
import { useFirebase } from "@/firebase/provider";
import { addDoc, collection, runTransaction, doc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

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
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || (userDoc.data().walletBalance || 0) < amount) {
          throw new Error('Insufficient balance.');
        }

        const newBalance = userDoc.data().walletBalance - amount;
        transaction.update(userRef, { walletBalance: newBalance });

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
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Request Failed', description: error.message || 'Could not submit withdrawal request.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const loading = userLoading || profileLoading || transactionsLoading;

  const totalWinnings = transactions
    .filter((t: Transaction) => t.type === 'prize' || t.type === 'win')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="bg-muted/30 flex flex-col min-h-screen">
       <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            <h1 className="text-xl font-bold">Wallet</h1>
      </header>

      <main className="flex-grow pb-20">
        <div className="relative">
            <div className="bg-primary h-24 rounded-b-3xl"></div>
            <Card className="bg-primary-dark text-primary-foreground shadow-lg mx-4 -mt-16 relative">
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm opacity-80">Total Balance</p>
                            {loading ? <Skeleton className="h-8 w-36 mt-1 bg-white/20"/> : <p className="text-3xl font-bold">₹{profile?.walletBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>}
                        </div>
                    </div>
                     <div className="flex justify-between items-center pt-2">
                        <div>
                            <p className="text-sm opacity-80">Winning Balance</p>
                            {loading ? <Skeleton className="h-6 w-28 mt-1 bg-white/20"/> : <p className="text-2xl font-bold">₹{totalWinnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Button className="py-6 text-base bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/add-money')}>
                  <Upload className="mr-2 h-5 w-5" /> Deposit
                </Button>
                 <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="py-6 text-base bg-red-500 hover:bg-red-600">
                      <Download className="mr-2 h-5 w-5" /> Withdraw
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
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                     <h2 className="text-lg font-semibold">Recent Transactions</h2>
                     <Link href="/wallet/history" className="text-sm font-semibold text-primary">View All</Link>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                    transactions.slice(0,5).map((tx: Transaction) => (
                    <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full", tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                                <p className="font-semibold capitalize">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-muted-foreground">{tx.createdAt ? format(tx.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}</p>
                            </div>
                        </div>
                        <p className={cn("font-bold text-lg", tx.amount > 0 ? "text-green-600" : "text-red-600")}>
                            {tx.amount > 0 ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </p>
                    </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">No transactions yet.</div>
                )}
                </div>
            </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
