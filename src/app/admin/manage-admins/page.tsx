
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
import { useCollection, useUser } from "@/firebase";
import { doc, updateDoc, writeBatch, collection } from "firebase/firestore";
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
import { Banknote } from "lucide-react";

export default function ManageAdminsPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!firestore) return;
    
    const userRef = doc(firestore, "users", userId);
    const updatedData = { role: newRole };

    updateDoc(userRef, updatedData)
      .then(() => {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}.`,
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleUpdateBalance = async () => {
    if (!firestore || !selectedUser || !currentUser) return;
    const numericAmount = parseFloat(amount);
    if(isNaN(numericAmount)) {
        toast({ variant: 'destructive', title: 'Invalid amount' });
        return;
    }

    const userRef = doc(firestore, "users", selectedUser.id);
    const superAdminRef = doc(firestore, "users", currentUser.uid);

    try {
        const batch = writeBatch(firestore);
        
        batch.update(userRef, { walletBalance: numericAmount });

        // Optional: Log this as a transaction for the superadmin
        const transactionRef = doc(collection(firestore, `users/${currentUser.uid}/transactions`));
        batch.set(transactionRef, {
            amount: 0,
            type: 'admin_action',
            description: `Set balance for ${selectedUser.name} to ₹${numericAmount}`,
            createdAt: new Date(),
            status: 'completed',
        });

        await batch.commit();

        toast({ title: 'Balance Updated', description: `${selectedUser.name}\'s balance has been set to ₹${numericAmount}.` });
        setIsDialogOpen(false);
        setAmount('');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Update failed' });
    }

  }
  
  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'deposit_admin':
        return 'default';
      case 'match_admin':
        return 'secondary';
      default:
        return 'outline';
    }
  }


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Manage Admins & Users</h1>
        <Card>
          <CardHeader>
            <CardTitle>User Roles & Balances</CardTitle>
            <CardDescription>
              Assign roles and manage wallet balances for all users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading users...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: UserProfile) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>₹{user.walletBalance?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          defaultValue={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                          disabled={user.role === 'superadmin' && user.id !== currentUser?.uid}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="deposit_admin">Deposit Admin</SelectItem>
                            <SelectItem value="match_admin">Match Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedUser(user);
                            setIsDialogOpen(true);
                          }}>
                              <Banknote className="mr-2 h-4 w-4"/>
                              Set Balance
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Update Wallet Balance</DialogTitle>
              <DialogDescription>
                  Manually set the wallet balance for {selectedUser?.name}. This action is logged.
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateBalance}>Update Balance</Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
}
