
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection, useUser } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Banknote, UserCog } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function ManageAdminsPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const functions = getFunctions();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'deposit_admin':
      case 'withdrawal_admin':
        return 'default';
      case 'match_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Manage Admins & Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Roles & Balances</CardTitle>
          <CardDescription>
            Assign roles and manage wallet balances for all users. Only superadmins can assign roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user: UserProfile) => (
                  <Card key={user.id}>
                    <CardHeader className="flex flex-row items-center gap-4">
                       <Avatar className="h-12 w-12">
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label className="text-xs">Role</Label>
                            <Select 
                                defaultValue={user.role}
                                onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                disabled={user.role === 'superadmin' && user.id !== currentUser?.uid || isSubmitting}
                            >
                                <SelectTrigger>
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
                        </div>
                        <div>
                            <Label className="text-xs">Balance</Label>
                            <p className="font-semibold">₹{user.walletBalance?.toLocaleString() || 0}</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                       <Dialog open={selectedUser?.id === user.id} onOpenChange={(isOpen) => {
                           if (!isOpen) {
                               setSelectedUser(null);
                               setAmount('');
                           }
                       }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                <Banknote className="mr-2 h-4 w-4"/>
                                Set Balance
                            </Button>
                        </DialogTrigger>
                         <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Wallet Balance</DialogTitle>
                                <DialogDescription>
                                    Manually set the wallet balance for {selectedUser?.displayName}. This action is logged.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="balance-amount">New Balance Amount (₹)</Label>
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
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
