
'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { DepositRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminDepositsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: deposits, loading: depositsLoading, reload: reloadDeposits } = useCollection<DepositRequest>('deposit-requests', {
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  });

  // This is not efficient, but it's the simplest way to get user data for each deposit.
  // In a real-world app, you'd want to denormalize user data onto the deposit request.
  const { data: users } = useCollection<UserProfile>('users');

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected', userId?: string, amount?: number) => {
    if (!firestore) return;
    try {
      const depositRef = doc(firestore, 'deposit-requests', id);

      if (newStatus === 'approved' && userId && amount) {
        const userRef = doc(firestore, 'users', userId);
        const batch = writeBatch(firestore);
        batch.update(depositRef, { status: newStatus });
        // This is not safe. In a real app, use a Cloud Function to update wallet balances.
        batch.update(userRef, { walletBalance: (users.find(u => u.id === userId)?.walletBalance || 0) + amount });
        await batch.commit();
      } else {
        await updateDoc(depositRef, { status: newStatus });
      }
      
      toast({ title: 'Success', description: `Deposit has been ${newStatus}.` });
      reloadDeposits();
    } catch (error) {
      console.error('Error updating deposit status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update deposit status.' });
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Manage Deposits</h1>
        <div className="flex space-x-2">
            <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
            <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depositsLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : deposits.map(deposit => (
              <TableRow key={deposit.id}>
                <TableCell>{getUserName(deposit.userId)}</TableCell>
                <TableCell>₹{deposit.amount}</TableCell>
                <TableCell>{deposit.createdAt ? format(new Date(deposit.createdAt.seconds * 1000), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                <TableCell><Badge>{deposit.status}</Badge></TableCell>
                <TableCell className="space-x-2">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">View</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Deposit Details</DialogTitle>
                                <DialogDescription>
                                    Review the details and screenshot before taking action.
                                </DialogDescription>
                            </DialogHeader>
                            <div className='space-y-4'>
                                <p><strong>User:</strong> {getUserName(deposit.userId)}</p>
                                <p><strong>Amount:</strong> ₹{deposit.amount}</p>
                                <p><strong>Transaction ID:</strong> {deposit.transactionId}</p>
                                <img src={deposit.screenshotUrl} alt="Payment Screenshot" className="rounded-md w-full" />
                                {deposit.status === 'pending' && (
                                    <div className="flex justify-end space-x-2 pt-4">
                                        <Button variant="destructive" onClick={() => handleUpdateStatus(deposit.id, 'rejected')}>Reject</Button>
                                        <Button onClick={() => handleUpdateStatus(deposit.id, 'approved', deposit.userId, deposit.amount)}>Approve</Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
