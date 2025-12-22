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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useUser, useCollectionGroup } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile, Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { Banknote } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserStats = {
  totalDeposits: number;
  totalWithdrawals: number;
  totalPrizes: number;
  totalEntryFees: number;
  profitLoss: number;
};

export default function ManageAdminsPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: transactions, loading: transactionsLoading } = useCollectionGroup<Transaction>('transactions');
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const functions = getFunctions();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userStats = useMemo(() => {
    const stats = new Map<string, UserStats>();
    if (!transactions) return stats;

    users.forEach(user => {
        stats.set(user.id, {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalPrizes: 0,
            totalEntryFees: 0,
            profitLoss: 0
        });
    });

    transactions.forEach(tx => {
        const userStat = stats.get(tx.userId);
        if (userStat) {
            switch(tx.type) {
                case 'deposit':
                case 'add_money':
                    userStat.totalDeposits += tx.amount;
                    break;
                case 'withdrawal':
                    userStat.totalWithdrawals += Math.abs(tx.amount);
                    break;
                case 'prize':
                case 'win':
                    userStat.totalPrizes += tx.amount;
                    break;
                case 'entry_fee':
                    userStat.totalEntryFees += Math.abs(tx.amount);
                    break;
            }
        }
    });
    
    stats.forEach(stat => {
      stat.profitLoss = stat.totalPrizes - stat.totalEntryFees;
    });

    return stats;
  }, [transactions, users]);


  const handleRoleChange = async (userId: string, newRole: string) => {
      setIsSubmitting(true);
      try {
        const setUserRole = httpsCallable(functions, 'setUserRole');
        await setUserRole({ userId: userId, role: newRole });
        toast({
          title: "Role Updated",
          description: `User role has been successfully set to ${newRole}.`,
        });
      } catch (error: any) {
         toast({
          variant: "destructive",
          title: "Error updating role",
          description: error.message || 'An unknown error occurred.',
        });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleUpdateBalance = async () => {
    if (!firestore || !selectedUser || !currentUser) return;
    const numericAmount = parseFloat(amount);
    if(isNaN(numericAmount)) {
        toast({ variant: 'destructive', title: 'Invalid amount' });
        return;
    }

    setIsSubmitting(true);
    const userRef = doc(firestore, "users", selectedUser.id);
    
    try {
        await updateDoc(userRef, { walletBalance: numericAmount });
        toast({ title: 'Balance Updated', description: `${selectedUser.displayName}\'s balance has been set to ₹${numericAmount}.` });
        setSelectedUser(null);
        setAmount('');
    } catch (error: any) {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { walletBalance: numericAmount },
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const loading = usersLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Manage Admins & Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Roles & Balances</CardTitle>
          <CardDescription>
            Assign roles and view detailed stats for all users. Only superadmins can assign roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Deposits</TableHead>
                    <TableHead className="text-right">Withdrawals</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-10 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    users.map((user: UserProfile) => {
                        const stats = userStats.get(user.id);
                        const matchesLost = (user.matchesPlayed || 0) - (user.matchesWon || 0);
                        return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.photoURL || undefined} />
                                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        defaultValue={user.role}
                                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                        disabled={user.role === 'superadmin' && user.id !== currentUser?.uid || isSubmitting}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="deposit_admin">Deposit Admin</SelectItem>
                                        <SelectItem value="withdrawal_admin">Withdrawal Admin</SelectItem>
                                        <SelectItem value="match_admin">Match Admin</SelectItem>
                                        <SelectItem value="superadmin">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right font-medium">₹{user.walletBalance?.toLocaleString() || 0}</TableCell>
                                <TableCell className="text-right text-green-600">₹{stats?.totalDeposits.toLocaleString() || 0}</TableCell>
                                <TableCell className="text-right text-red-600">₹{stats?.totalWithdrawals.toLocaleString() || 0}</TableCell>
                                <TableCell className={`text-right font-semibold ${stats && stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{stats?.profitLoss.toLocaleString() || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                     <Dialog open={selectedUser?.id === user.id} onOpenChange={(isOpen) => {
                                        if (!isOpen) {
                                            setSelectedUser(null);
                                            setAmount('');
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)}>
                                                <Banknote className="h-4 w-4"/>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-sm">
                                            <DialogHeader>
                                                <DialogTitle>Update Wallet Balance</DialogTitle>
                                                <DialogDescription>
                                                    Manually set the wallet balance for {selectedUser?.displayName}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="balance-amount">New Balance (₹)</Label>
                                                    <Input 
                                                        id="balance-amount" 
                                                        type="number" 
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder={`Current: ₹${selectedUser?.walletBalance || 0}`}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                                                <Button onClick={handleUpdateBalance} disabled={isSubmitting}>Update Balance</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
