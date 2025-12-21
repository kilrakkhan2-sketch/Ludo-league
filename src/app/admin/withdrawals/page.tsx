
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { WithdrawalRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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

        <div className="flex space-x-2 border-b pb-4">
            <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
            <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </div>

        {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
             </div>
        ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((req: WithdrawalRequest) => {
                    const user = usersMap.get(req.userId);
                    const processor = req.processedBy ? usersMap.get(req.processedBy) : null;
                    return (
                        <Card key={req.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl font-bold text-destructive">-₹{req.amount.toLocaleString()}</CardTitle>
                                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                                </div>
                                <div>
                                    <p className="font-semibold">{user?.name || req.userName}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email || req.userEmail}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 text-sm">
                                <p className="capitalize"><strong>Method:</strong> {req.method}</p>
                                <p className="font-mono text-xs truncate"><strong>Details:</strong> {req.details}</p>
                                <p className="text-xs text-muted-foreground pt-2">
                                     {req.createdAt ? format((req.createdAt as any).toDate(), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                                </p>
                            </CardContent>
                             <CardFooter>
                                {statusFilter === 'pending' && (
                                   <Dialog open={selectedRequest?.id === req.id} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                                        <DialogTrigger asChild>
                                             <Button className='w-full' size="sm" onClick={() => setSelectedRequest(req)}>Process</Button>
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
                                                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-2">
                                                        <Button className='w-full' size="sm" variant="destructive" onClick={() => handleReject(selectedRequest)} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                                        <Button className='w-full' size="sm" onClick={() => handleApprove(selectedRequest)} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                                    </DialogFooter>
                                                </div>
                                                 <div className='max-h-[80vh] overflow-y-auto'>
                                                    {selectedRequest && <AdminChatRoom contextPath={`withdrawal-requests/${selectedRequest.id}`} />}
                                                </div>
                                            </DialogContent>
                                        )}
                                   </Dialog>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-12">
                 <p className="text-muted-foreground">No {statusFilter} withdrawal requests.</p>
            </div>
        )}
        </div>
  );
}
