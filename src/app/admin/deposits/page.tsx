
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { DepositRequest, UserProfile } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminChatRoom } from '@/components/chat/AdminChatRoom';
import { httpsCallable } from 'firebase/functions';
import { useFunctions } from '@/firebase/provider';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

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
  const { firestore } = useFirebase();
  const functions = useFunctions();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: ['status', '==', statusFilter] as const
  }), [statusFilter]);
  const { data: deposits, loading: depositsLoading } = useCollection<DepositRequest>('deposit-requests', queryOptions);

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

  const handleDeleteScreenshot = async (screenshotUrl: string) => {
    if (!functions) return;
    if (!window.confirm('Are you sure you want to permanently delete this screenshot?')) return;

    setIsSubmitting(true);
    try {
        const deleteStorageFile = httpsCallable(functions, 'deleteStorageFile');
        const filePath = new URL(screenshotUrl).pathname.split('/o/')[1].split('?')[0];
        await deleteStorageFile({ filePath: decodeURIComponent(filePath) });
        toast({ title: 'Screenshot Deleted', description: 'The image has been permanently removed from storage.' });
    } catch(error: any) {
        console.error("Error deleting screenshot:", error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message || 'Could not delete the screenshot.' });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const isLoading = depositsLoading;

  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Manage Deposits</h1>
        
        <div className="flex space-x-2 border-b pb-4">
            <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
            <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </div>
        
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : deposits.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No {statusFilter} deposits found.</p>
            </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deposits.map((deposit: DepositRequest) => (
                    <Card key={deposit.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-2xl font-bold">₹{deposit.amount.toLocaleString()}</CardTitle>
                                <Badge variant={getStatusVariant(deposit.status)}>{deposit.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground"><UserCell userId={deposit.userId} /></div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                            <p><strong>Date:</strong> {deposit.createdAt ? format((deposit.createdAt as Timestamp).toDate(), 'dd MMM, HH:mm') : 'N/A'}</p>
                            <p className='truncate'><strong>Ref ID:</strong> {deposit.transactionId}</p>
                            {statusFilter !== 'pending' && <p><strong>Processed By:</strong> <ProcessorCell userId={deposit.processedBy} /></p>}
                        </CardContent>
                        <CardFooter>
                           <Dialog open={selectedDeposit?.id === deposit.id} onOpenChange={(isOpen) => !isOpen && setSelectedDeposit(null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" onClick={() => setSelectedDeposit(deposit)}>
                                    <Eye className="mr-2 h-4 w-4" />Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl grid-cols-1 md:grid-cols-2 grid gap-6">
                                  <div>
                                      <DialogHeader>
                                          <DialogTitle>Deposit Details</DialogTitle>
                                          <DialogDescription>Review the details and screenshot before taking action.</DialogDescription>
                                      </DialogHeader>
                                       {selectedDeposit && (
                                         <div className='space-y-4 py-4'>
                                            <p><strong>User:</strong> <UserCell userId={selectedDeposit.userId} /></p>
                                            <p><strong>Amount:</strong> <span className="font-bold text-lg">₹{selectedDeposit.amount}</span></p>
                                            <p><strong>Transaction ID:</strong> <span className="font-mono bg-muted p-1 rounded">{selectedDeposit.transactionId}</span></p>
                                             <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                                                  <Image src={selectedDeposit.screenshotUrl} alt="Payment Screenshot" layout="fill" objectFit="contain" />
                                              </div>
                                              <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleDeleteScreenshot(selectedDeposit.screenshotUrl)} disabled={isSubmitting}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Screenshot
                                              </Button>
                                        </div>
                                       )}
                                      {deposit.status === 'pending' && (
                                          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                                              <Button className='w-full' variant="destructive" onClick={() => handleRejectDeposit(deposit)} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
                                              <Button className='w-full' onClick={() => handleApproveDeposit(deposit)} disabled={isSubmitting}><CheckCircle className="mr-2 h-4 w-4"/>Approve</Button>
                                          </DialogFooter>
                                      )}
                                  </div>
                                  <div className='max-h-[80vh] overflow-y-auto'>
                                    {selectedDeposit && <AdminChatRoom contextPath={`deposit-requests/${selectedDeposit.id}`} />}
                                  </div>
                              </DialogContent>
                          </Dialog>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        )}
      </div>
  );
}
