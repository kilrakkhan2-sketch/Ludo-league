
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { WithdrawalRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from '@/components/ui/skeleton';
import { AdminChatRoom } from '@/components/chat/AdminChatRoom';


const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

export default function AdminWithdrawalsPage() {
  const functions = getFunctions();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  const requestQueryOptions = useMemo(() => ({
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  }), [statusFilter]);
  const { data: requests, loading } = useCollection<WithdrawalRequest>('withdrawal-requests', requestQueryOptions);

  const allUserIdsInView = useMemo(() => {
    if (!requests || requests.length === 0) return ['_'];
    const ids = new Set<string>();
    requests.forEach((r: WithdrawalRequest) => {
        ids.add(r.userId);
        if (r.processedBy) {
            ids.add(r.processedBy);
        }
    });
    return Array.from(ids);
  }, [requests]);

  const usersQueryOptions = useMemo(() => ({
    where: ['uid', 'in', allUserIdsInView]
  }), [allUserIdsInView]);
  const { data: usersData, loading: usersLoading } = useCollection<UserProfile>('users', usersQueryOptions);

  const usersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    if (usersData) {
        usersData.forEach((user: UserProfile) => map.set(user.uid, user));
    }
    return map;
  }, [usersData]);
  
  const handleApprove = async (request: WithdrawalRequest) => {
    setIsSubmitting(true);
    try {
      const approveWithdrawal = httpsCallable(functions, 'approveWithdrawal');
      await approveWithdrawal({ withdrawalId: request.id });
      toast({ title: 'Success', description: `Request has been approved.` });
      setSelectedRequest(null);
    } catch(error: any) {
      console.error("Error approving withdrawal:", error);
      toast({ variant: 'destructive', title: 'Processing Error', description: error.message || 'Could not process the request.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleReject = async (request: WithdrawalRequest) => {
     setIsSubmitting(true);
    try {
      const rejectWithdrawal = httpsCallable(functions, 'rejectWithdrawal');
      await rejectWithdrawal({ withdrawalId: request.id });
      toast({ title: 'Success', description: `Request has been rejected.` });
      setSelectedRequest(null);
    } catch(error: any) {
      console.error("Error rejecting withdrawal:", error);
      toast({ variant: 'destructive', title: 'Processing Error', description: error.message || 'Could not process the request.' });
    } finally {
      setIsSubmitting(false);
    }
  }


  const isLoading = loading || usersLoading;

  return (
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
                {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : requests.length > 0 ? requests.map((req: WithdrawalRequest) => {
                    const user = usersMap.get(req.userId);
                    const processor = req.processedBy ? usersMap.get(req.processedBy) : null;
                    return (
                    <TableRow key={req.id}>
                    <TableCell>{req.createdAt ? format((req.createdAt as any).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
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
                           <Dialog open={selectedRequest?.id === req.id} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                                <DialogTrigger asChild>
                                     <Button size="sm" onClick={() => setSelectedRequest(req)}>Process</Button>
                                </DialogTrigger>
                                {selectedRequest && selectedRequest.id === req.id && (
                                     <DialogContent className="max-w-2xl grid-cols-1 md:grid-cols-2 grid gap-6">
                                        <div>
                                            <DialogHeader>
                                                <DialogTitle>Process Withdrawal</DialogTitle>
                                                <DialogDescription>
                                                You are about to process a withdrawal of <span className="font-bold">₹{selectedRequest.amount}</span> for {user?.name || selectedRequest.userName}.
                                                Ensure funds are transferred externally before approving. This action is irreversible.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter className="mt-8">
                                                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleReject(selectedRequest)} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                                <Button size="sm" onClick={() => handleApprove(selectedRequest)} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                            </DialogFooter>
                                        </div>
                                         <div className='max-h-[80vh] overflow-y-auto'>
                                            {selectedRequest && <AdminChatRoom contextPath={`withdrawal-requests/${selectedRequest.id}`} />}
                                        </div>
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
  );
}
