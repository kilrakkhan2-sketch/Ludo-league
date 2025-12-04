
'use client';

import { useState, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { DepositRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'yellow';
    case 'approved': return 'green';
    case 'rejected': return 'red';
    default: return 'secondary';
  }
};

export default function AdminDepositsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: deposits, loading: depositsLoading, reload: reloadDeposits } = useCollection<DepositRequest>('deposit-requests', {
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  });

  const userIds = useMemo(() => deposits.map(d => d.userId), [deposits]);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users', { where: ['uid', 'in', userIds] });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  const handleUpdateStatus = async (deposit: DepositRequest, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !deposit.userId || !deposit.amount) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      const depositRef = doc(firestore, 'deposit-requests', deposit.id);
      
      batch.update(depositRef, { status: newStatus, processedAt: Timestamp.now() });

      if (newStatus === 'approved') {
        const userRef = doc(firestore, 'users', deposit.userId);
        const transactionRef = doc(firestore, `users/${deposit.userId}/transactions`, `deposit_${deposit.id}`);

        // Note: A Cloud Function should be used for this logic to be secure and atomic.
        // The function would trigger on the creation of the transaction document.
        const userDoc = usersMap.get(deposit.userId);
        const newBalance = (userDoc?.balance || 0) + deposit.amount;
        batch.update(userRef, { balance: newBalance });

        batch.set(transactionRef, {
          amount: deposit.amount,
          type: 'deposit',
          description: 'Manual deposit approval by admin',
          createdAt: Timestamp.now(),
          status: 'completed'
        });
      }

      await batch.commit();
      toast({ title: 'Success', description: `Deposit has been ${newStatus}.` });
      reloadDeposits();
    } catch (error) {
      console.error('Error updating deposit status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update deposit status.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Manage Deposits</h1>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Deposit Requests</CardTitle>
                <div className="flex space-x-2">
                    <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
                    <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
                    <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(depositsLoading || usersLoading) ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : deposits.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center">No {statusFilter} deposits found.</TableCell></TableRow>
                ) : deposits.map(deposit => {
                  const user = usersMap.get(deposit.userId);
                  return (
                    <TableRow key={deposit.id}>
                      <TableCell>{user?.displayName || 'Unknown'}</TableCell>
                      <TableCell className="font-medium">₹{deposit.amount.toLocaleString()}</TableCell>
                      <TableCell>{deposit.createdAt ? format((deposit.createdAt as Timestamp).toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(deposit.status)}>{deposit.status}</Badge></TableCell>
                      <TableCell className="text-right">
                          <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                              <DialogContent className="max-w-md">
                                  <DialogHeader>
                                      <DialogTitle>Deposit Details</DialogTitle>
                                      <DialogDescription>Review the details and screenshot before taking action.</DialogDescription>
                                  </DialogHeader>
                                  <div className='space-y-4'>
                                      <p><strong>User:</strong> {user?.displayName} ({user?.email})</p>
                                      <p><strong>Amount:</strong> <span className="font-bold text-lg">₹{deposit.amount}</span></p>
                                      <p><strong>Transaction ID:</strong> <span className="font-mono bg-muted p-1 rounded">{deposit.transactionId}</span></p>
                                       <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                                            <Image src={deposit.screenshotUrl} alt="Payment Screenshot" layout="fill" objectFit="contain" />
                                        </div>
                                  </div>
                                  {deposit.status === 'pending' && (
                                      <DialogFooter className="pt-4">
                                          <Button variant="destructive" onClick={() => handleUpdateStatus(deposit, 'rejected')} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                          <Button onClick={() => handleUpdateStatus(deposit, 'approved')} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                      </DialogFooter>
                                  )}
                              </DialogContent>
                          </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
           </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
