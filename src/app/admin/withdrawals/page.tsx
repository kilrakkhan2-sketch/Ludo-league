
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useUser, useDoc } from '@/firebase';
import { doc, writeBatch, Timestamp, collection, getDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
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
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function AdminWithdrawalsPage() {
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { data: adminProfile } = useDoc<UserProfile>(adminUser ? `users/${adminUser.uid}`: '');
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  const { data: requests, loading } = useCollection<WithdrawalRequest>('withdrawal-requests', {
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  });

  const allUserIdsInView = useMemo(() => {
    const ids = new Set<string>();
    requests.forEach((r: WithdrawalRequest) => {
        ids.add(r.userId);
        if (r.processedBy) {
            ids.add(r.processedBy);
        }
    });
    // Ensure the list is not empty to prevent Firestore errors with 'in' queries
    if (ids.size === 0) {
        return ['_']; // Use a placeholder that won't match any documents
    }
    return Array.from(ids);
  }, [requests]);

  const { data: usersData, loading: usersLoading } = useCollection<UserProfile>('users', {
    where: ['uid', 'in', allUserIdsInView]
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    usersData.forEach((user: UserProfile) => map.set(user.uid, user));
    return map;
  }, [usersData]);

  const handleProcessRequest = async (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser || !adminProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process request. Admin not found.' });
      return;
    }
    setIsSubmitting(true);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const adminRef = doc(firestore, 'users', adminUser.uid);
            const requestRef = doc(firestore, 'withdrawal-requests', request.id);
            const userRef = doc(firestore, 'users', request.userId);

            const adminDoc = await transaction.get(adminRef);
            const adminData = adminDoc.data() as UserProfile;
            
            // Find the original user transaction to update its status
            const userTransactionQuery = query(collection(firestore, `users/${request.userId}/transactions`), where('relatedId', '==', request.id));
            const userTransactionsSnapshot = await getDocs(userTransactionQuery);
            const userTransactionRef = userTransactionsSnapshot.docs[0]?.ref;

            if (action === 'approve') {
                if ((adminData.walletBalance || 0) < request.amount) {
                    throw new Error("You have insufficient balance to approve this withdrawal.");
                }

                transaction.update(requestRef, {
                    status: 'approved',
                    processedAt: Timestamp.now(),
                    processedBy: adminUser.uid,
                });

                if (userTransactionRef) {
                    transaction.update(userTransactionRef, { status: 'completed' });
                }

                // Deduct amount from admin's wallet
                const newAdminBalance = (adminData.walletBalance || 0) - request.amount;
                transaction.update(adminRef, { walletBalance: newAdminBalance });

                // Create a transaction record for the admin
                const adminTransactionRef = doc(collection(firestore, `users/${adminUser.uid}/transactions`));
                transaction.set(adminTransactionRef, {
                    amount: -request.amount,
                    type: 'withdrawal',
                    status: 'completed',
                    description: `Approved withdrawal for ${request.userName}`,
                    relatedId: request.id,
                    createdAt: Timestamp.now(),
                    userName: adminData.name,
                    userEmail: adminData.email,
                });

            } else { // 'reject'
                transaction.update(requestRef, {
                    status: 'rejected',
                    processedAt: Timestamp.now(),
                    processedBy: adminUser.uid,
                });
                
                // Refund the amount to the user's wallet
                const userDoc = await transaction.get(userRef);
                const userProfile = userDoc.data() as UserProfile;
                const newUserBalance = (userProfile.walletBalance || 0) + request.amount;
                transaction.update(userRef, { walletBalance: newUserBalance });
                
                if (userTransactionRef) {
                    transaction.update(userTransactionRef, { status: 'failed', description: 'Withdrawal request rejected by admin.' });
                }
            }
        });

        toast({ title: 'Success', description: `Request has been ${action}ed.` });
        setSelectedRequest(null);
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
                    {statusFilter !== 'pending' && <TableHead>Processed By</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading || usersLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                ) : requests.length > 0 ? requests.map((req: WithdrawalRequest) => {
                    const user = usersMap.get(req.userId);
                    const processor = req.processedBy ? usersMap.get(req.processedBy) : null;
                    return (
                    <TableRow key={req.id}>
                    <TableCell>{req.createdAt ? format((req.createdAt as Timestamp).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                        <div>{user?.name || req.userName}</div>
                        <div className="text-xs text-muted-foreground">{user?.email || req.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">-₹{req.amount.toLocaleString()}</TableCell>
                    <TableCell className='capitalize'>{req.method}</TableCell>
                    <TableCell className="font-mono text-xs">{req.details}</TableCell>
                    {statusFilter !== 'pending' && <TableCell>{processor?.displayName || 'N/A'}</TableCell>}
                    <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                        {statusFilter === 'pending' && (
                           <Dialog>
                                <DialogTrigger>
                                     <Button size="sm" onClick={() => setSelectedRequest(req)}>Process</Button>
                                </DialogTrigger>
                                {selectedRequest && selectedRequest.id === req.id && (
                                     <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Process Withdrawal</DialogTitle>
                                            <DialogDescription>
                                            You are about to process a withdrawal of <span className="font-bold">₹{selectedRequest.amount}</span> for {user?.name || selectedRequest.userName}.
                                            Ensure funds are transferred externally before approving. This action is irreversible. Approving will deduct ₹{selectedRequest.amount} from your admin wallet.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleProcessRequest(selectedRequest, 'reject')} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                            <Button size="sm" onClick={() => handleProcessRequest(selectedRequest, 'approve')} disabled={isSubmitting || (adminProfile?.walletBalance || 0) < selectedRequest.amount}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                )}
                           </Dialog>
                        )}
                    </TableCell>
                    </TableRow>
                )}) : (
                    <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">No {statusFilter} withdrawal requests.</TableCell>
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

    