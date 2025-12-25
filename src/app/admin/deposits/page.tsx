
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useUser } from '@/firebase';
import { updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { DepositRequest, UserProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: DepositRequest['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'approved':
    case 'completed':
      return 'success';
    case 'rejected':
    case 'failed':
      return 'destructive';
    default:
      return 'default';
  }
};

export default function AdminDepositsPage() {
  const { userData: adminUser, loading: adminLoading } = useUser();
  const { firestore } = useFirebase();
  const [status, setStatus] = useState<DepositRequest['status']>('pending');
  
  const { data: requests, loading } = useCollection<DepositRequest>('deposit-requests', {
    where: ['status', '==', status],
    orderBy: ['createdAt', 'desc']
  });

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const userMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => ({...acc, [user.uid]: user }), {} as Record<string, UserProfile>);
  }, [users]);

  const [imageToView, setImageToView] = useState<string | null>(null);
  const [action, setAction] = useState<{ type: 'approve' | 'reject'; request: DepositRequest } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async () => {
    if (!action || !firestore || !adminUser) return;

    setIsSubmitting(true);
    const { type, request } = action;
    const newStatus = type === 'approve' ? 'approved' : 'rejected';

    try {
      const requestRef = doc(firestore, 'deposit-requests', request.id);

      // 'onDepositStatusChange' cloud function handles the wallet update if status is set to 'approved'.
      await updateDoc(requestRef, {
        status: newStatus,
        processedAt: serverTimestamp(),
        processedBy: adminUser.uid
      });
      
      toast.success(`Request has been ${newStatus}.`);
    } catch (error) {
      console.error(`Failed to ${type} request:`, error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };
  
  const isLoading = loading || usersLoading || adminLoading;

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manage Deposits</h1>
        
        <Tabs value={status} onValueChange={(value) => setStatus(value as DepositRequest['status'])}>
            <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
        </Tabs>

        <Card>
            <CardHeader>
                <CardTitle>{status.charAt(0).toUpperCase() + status.slice(1)} Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>TXN ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className='text-right'><Skeleton className="h-8 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : requests && requests.length > 0 ? (
                        requests.map((request) => (
                            <TableRow key={request.id}>
                            <TableCell>{userMap[request.userId]?.displayName || request.userName || 'Unknown User'}</TableCell>
                            <TableCell>₹{request.amount.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-xs">{request.transactionId}</TableCell>
                            <TableCell>{request.createdAt?.seconds ? new Date(request.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" onClick={() => setImageToView(request.screenshotUrl ?? null)}><Eye className="h-4 w-4" /><span className="sr-only">View Screenshot</span></Button>
                                {request.status === 'pending' && (adminUser?.role === 'superadmin' || adminUser?.role === 'deposit_admin') && (
                                    <>
                                        <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'reject', request })} disabled={isSubmitting}><XCircle className="h-4 w-4" /><span className="sr-only">Reject</span></Button>
                                        <Button variant="success" size="icon" onClick={() => setAction({ type: 'approve', request })} disabled={isSubmitting}><CheckCircle className="h-4 w-4" /><span className="sr-only">Approve</span></Button>
                                    </>
                                )}
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                            No {status} requests found.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      {imageToView && (
        <Dialog open={!!imageToView} onOpenChange={(open) => !open && setImageToView(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Screenshot</DialogTitle>
            </DialogHeader>
            <img src={imageToView} alt="Payment Screenshot" className="w-full h-auto rounded-md" />
          </DialogContent>
        </Dialog>
      )}

      {action && (
        <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
            </DialogHeader>
            <Alert variant={action.type === 'reject' ? 'destructive' : 'default'}>
              <AlertTitle>Are you sure?</AlertTitle>
              <AlertDescription>
                You are about to {action.type} a deposit of ₹{action.request.amount} for {userMap[action.request.userId]?.displayName}. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button variant={action.type === 'reject' ? 'destructive' : 'success'} onClick={handleAction} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : `Confirm ${action.type.charAt(0).toUpperCase() + action.type.slice(1)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
