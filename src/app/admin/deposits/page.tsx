
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

// This component fetches user data for a single user ID.
const UserCell = ({ userId }: { userId: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${userId}`);
    if (loading) return <Skeleton className="h-5 w-24" />;
    return <>{user?.displayName || 'Unknown User'}</>;
}
const ProcessorCell = ({ userId }: { userId: string | undefined }) => {
    const { data: user, loading } = useDoc<UserProfile>(userId ? `users/${userId}` : undefined);
    if (!userId) return <>N/A</>;
    if (loading) return <Skeleton className="h-5 w-24" />;
    return <>{user?.displayName || 'Unknown'}</>;
}


export default function AdminDepositsPage() {
  const { firestore, app } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);


  const { data: deposits, loading: depositsLoading } = useCollection<DepositRequest>('deposit-requests', {
    orderBy: ['createdAt', 'desc'],
    where: ['status', '==', statusFilter]
  });

 const handleApproveDeposit = async (deposit: DepositRequest) => {
    if (!firestore || !adminUser) return;
    setIsSubmitting(true);
    try {
      const depositRef = doc(firestore, 'deposit-requests', deposit.id);
      const batch = writeBatch(firestore);
      batch.update(depositRef, { 
          status: 'approved', 
          processedAt: Timestamp.now(),
          processedBy: adminUser.uid,
      });
      await batch.commit();

      // The actual crediting logic is handled by the onDepositStatusChange cloud function
      // to ensure atomicity and handle referral bonuses.
      
      toast({ title: 'Success', description: 'Deposit has been approved. The cloud function will process the transaction.' });

    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not approve deposit.' });
    } finally {
      setIsSubmitting(false);
      setSelectedDeposit(null);
    }
  };

  const handleRejectDeposit = async (deposit: DepositRequest) => {
    if (!firestore || !adminUser) return;
    setIsSubmitting(true);
    try {
      const depositRef = doc(firestore, 'deposit-requests', deposit.id);
      const batch = writeBatch(firestore);
      batch.update(depositRef, { 
          status: 'rejected', 
          processedAt: Timestamp.now(),
          processedBy: adminUser.uid,
        });
      await batch.commit();
      toast({ title: 'Success', description: 'Deposit has been rejected.' });
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not reject deposit.' });
    } finally {
      setIsSubmitting(false);
      setSelectedDeposit(null);
    }
  };
  
  const isLoading = depositsLoading;

  return (
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
                  {statusFilter !== 'pending' && <TableHead>Processed By</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : deposits.length === 0 ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">No {statusFilter} deposits found.</TableCell></TableRow>
                ) : deposits.map((deposit: DepositRequest) => {
                  return (
                    <TableRow key={deposit.id}>
                      <TableCell><UserCell userId={deposit.userId} /></TableCell>
                      <TableCell className="font-medium">₹{deposit.amount.toLocaleString()}</TableCell>
                      <TableCell>{deposit.createdAt ? format((deposit.createdAt as Timestamp).toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                      {statusFilter !== 'pending' && <TableCell><ProcessorCell userId={deposit.processedBy} /></TableCell>}
                      <TableCell><Badge variant={getStatusVariant(deposit.status)}>{deposit.status}</Badge></TableCell>
                      <TableCell className="text-right">
                          <Dialog open={selectedDeposit?.id === deposit.id} onOpenChange={(isOpen) => !isOpen && setSelectedDeposit(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedDeposit(deposit)}><Eye className="h-4 w-4" /></Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                  <DialogHeader>
                                      <DialogTitle>Deposit Details</DialogTitle>
                                      <DialogDescription>Review the details and screenshot before taking action.</DialogDescription>
                                  </DialogHeader>
                                   {selectedDeposit && (
                                     <div className='space-y-4'>
                                        <p><strong>User:</strong> <UserCell userId={selectedDeposit.userId} /></p>
                                        <p><strong>Amount:</strong> <span className="font-bold text-lg">₹{selectedDeposit.amount}</span></p>
                                        <p><strong>Transaction ID:</strong> <span className="font-mono bg-muted p-1 rounded">{selectedDeposit.transactionId}</span></p>
                                         <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                                              <Image src={selectedDeposit.screenshotUrl} alt="Payment Screenshot" layout="fill" objectFit="contain" />
                                          </div>
                                    </div>
                                   )}
                                  {deposit.status === 'pending' && (
                                      <DialogFooter className="pt-4">
                                          <Button variant="destructive" onClick={() => handleRejectDeposit(deposit)} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                          <Button onClick={() => handleApproveDeposit(deposit)} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
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
  );
}
