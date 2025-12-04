
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser } from '@/firebase';
import { doc, writeBatch, Timestamp, collection, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { WithdrawalRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { AdminShell } from '@/components/layout/AdminShell';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'yellow';
    case 'approved': return 'green';
    case 'rejected': return 'red';
    default: return 'secondary';
  }
};

export default function AdminWithdrawalsPage() {
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: requests, loading, reload: reloadRequests } = useCollection<WithdrawalRequest>('withdrawal-requests', {
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  });

  const userIds = useMemo(() => Array.from(new Set(requests.map(r => r.userId))), [requests]);
  const { data: usersData } = useCollection<UserProfile>('users', {
    where: ['uid', 'in', userIds.length > 0 ? userIds : ['_']]
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    usersData.forEach(user => map.set(user.uid, user));
    return map;
  }, [usersData]);

  const handleProcessRequest = async (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process request. Admin not found.' });
      return;
    }
    setIsSubmitting(true);
    
    try {
        const batch = writeBatch(firestore);
        const adminRef = doc(firestore, 'users', adminUser.uid);
        const requestRef = doc(firestore, 'withdrawal-requests', request.id);
        const userRef = doc(firestore, 'users', request.userId);
        
        // This query is for finding the user's corresponding withdrawal transaction to update its status
        const userTransactionQuery = query(collection(firestore, `users/${request.userId}/transactions`), where('relatedId', '==', request.id));
        const userTransactionsSnapshot = await getDocs(userTransactionQuery);
        const userTransactionRef = userTransactionsSnapshot.docs[0]?.ref;

        if (action === 'approve') {
            const adminDoc = await getDoc(adminRef);
            const adminProfile = adminDoc.data() as UserProfile;

            if ((adminProfile.walletBalance || 0) < request.amount) {
                throw new Error("You have insufficient balance to approve this withdrawal.");
            }

            // 1. Update request status
            batch.update(requestRef, {
                status: 'approved',
                processedAt: Timestamp.now(),
                processedBy: adminUser.uid,
            });

            // 2. Update user's transaction status from pending to completed
            if(userTransactionRef) {
                batch.update(userTransactionRef, { status: 'completed' });
            }

            // 3. Deduct amount from approving admin's wallet
            const newAdminBalance = (adminProfile.walletBalance || 0) - request.amount;
            batch.update(adminRef, { walletBalance: newAdminBalance });

            // 4. Create a transaction record for the admin
            const adminTransactionRef = doc(collection(firestore, `users/${adminUser.uid}/transactions`));
            batch.set(adminTransactionRef, {
                amount: -request.amount,
                type: 'withdrawal',
                status: 'completed',
                description: `Approved withdrawal for ${request.userName}`,
                relatedId: request.id,
                createdAt: Timestamp.now(),
            });

        } else { // 'reject'
            // 1. Update request status
            batch.update(requestRef, {
                status: 'rejected',
                processedAt: Timestamp.now(),
                processedBy: adminUser.uid,
            });

            // 2. Refund the amount to the user's wallet
            const userDoc = await getDoc(userRef);
            const userProfile = userDoc.data() as UserProfile;
            const newUserBalance = (userProfile.walletBalance || 0) + request.amount;
            batch.update(userRef, { walletBalance: newUserBalance });
            
            // 3. Update user's transaction status to 'failed'
            if(userTransactionRef) {
                batch.update(userTransactionRef, { status: 'failed', description: 'Withdrawal request rejected by admin.' });
            }
        }

        await batch.commit();
        toast({ title: 'Success', description: `Request has been ${action}ed.` });
        reloadRequests();
    } catch (error: any) {
        console.error("Error processing withdrawal:", error);
        toast({ variant: 'destructive', title: 'Processing Error', description: error.message || 'Could not process the request.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <AdminShell>
        <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Withdrawal Requests</h1>
        <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Withdrawal Requests</CardTitle>
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
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                ) : requests.length > 0 ? requests.map(req => {
                    const user = usersMap.get(req.userId);
                    return (
                    <TableRow key={req.id}>
                    <TableCell>{req.createdAt ? format((req.createdAt as Timestamp).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                        <div>{req.userName || user?.name}</div>
                        <div className="text-xs text-muted-foreground">{req.userEmail || user?.email}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">-₹{req.amount.toLocaleString()}</TableCell>
                    <TableCell className='capitalize'>{req.method}</TableCell>
                    <TableCell className="font-mono text-xs">{req.details}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                        {statusFilter === 'pending' && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm">Process</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Process Withdrawal</DialogTitle>
                                    <DialogDescription>
                                    You are about to process a withdrawal of <span className="font-bold">₹{req.amount}</span> for {req.userName}.
                                    Ensure funds are transferred externally before approving. This action is irreversible.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button size="sm" variant="destructive" onClick={() => handleProcessRequest(req, 'reject')} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                    <Button size="sm" onClick={() => handleProcessRequest(req, 'approve')} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        )}
                    </TableCell>
                    </TableRow>
                )}) : (
                    <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No {statusFilter} withdrawal requests.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        </div>
    </AdminShell>
  );
}
