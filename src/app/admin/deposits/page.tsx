
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { useFirebase, useFunctions, useUser } from '@/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { DepositRequest, UserProfile } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, Copy, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    return (
        <div className="flex flex-col">
            <span className='font-medium'>{user?.displayName || 'Unknown User'}</span>
            <span className='text-xs text-muted-foreground'>{user?.email}</span>
        </div>
    );
};

export default function AdminDepositsPage() {
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [action, setAction] = useState<{ type: 'approve' | 'reject', request: DepositRequest } | null>(null);

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: ['status', '==', statusFilter] as const,
    limit: 50
  }), [statusFilter]);
  const { data: deposits, loading } = useCollection<DepositRequest>('deposit-requests', queryOptions);

  const handleProcessRequest = async () => {
    if (!firestore || !adminUser || !action) return;
    setIsSubmitting(true);
    try {
      const { type, request } = action;
      const depositRef = doc(firestore, 'deposit-requests', request.id);
      const batch = writeBatch(firestore);
      batch.update(depositRef, { 
          status: type, 
          processedAt: Timestamp.now(),
          processedBy: adminUser.uid,
      });
      await batch.commit();
      
      // A cloud function (`onDepositStatusChange`) should listen for this status change to securely:
      // 1. Create a transaction document.
      // 2. Update the user's walletBalance.
      // 3. Award referral bonus if applicable.
      // 4. If rejected, delete the screenshot from storage.
      
      toast({ title: 'Success', description: `Deposit has been ${type}. The transaction will be processed.` });

    } catch (error: any) {
      console.error(`Error processing deposit:`, error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not process the request.' });
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };
  
  return (
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Manage Deposits</h1>
            <p className="text-muted-foreground">Review and process user deposit requests.</p>
        </div>

        <div className="flex space-x-2 border-b pb-4">
            <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
            <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </div>

        <div className="border rounded-lg bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
                        <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && [...Array(5)].map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, c) => <TableCell key={c}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>)}
                    {!loading && deposits?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No {statusFilter} deposits.</TableCell></TableRow>}
                    {!loading && deposits?.map((request: DepositRequest) => (
                        <TableRow key={request.id}>
                            <TableCell><UserCell userId={request.userId} /></TableCell>
                            <TableCell className="font-semibold">₹{request.amount.toLocaleString()}</TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                    <span className='font-mono text-xs'>{request.transactionId}</span>
                                    <Copy className='h-3 w-3 cursor-pointer' onClick={() => navigator.clipboard.writeText(request.transactionId)} />
                                </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{request.createdAt ? formatDistanceToNow((request.createdAt as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="icon" onClick={() => setImageToView(request.screenshotUrl)}><Eye className="h-4 w-4" /><span className="sr-only">View Screenshot</span></Button>
                                {request.status === 'pending' && adminUser?.role !== 'match_admin' && (
                                    <>
                                        <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'reject', request })} disabled={isSubmitting}><XCircle className="h-4 w-4" /><span className="sr-only">Reject</span></Button>
                                        <Button size="icon" onClick={() => setAction({ type: 'approve', request })} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4" /><span className="sr-only">Approve</span></Button>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <Dialog open={!!imageToView} onOpenChange={(isOpen) => !isOpen && setImageToView(null)}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col"><DialogHeader><DialogTitle>Payment Screenshot</DialogTitle></DialogHeader><div className="flex-grow relative"><Image src={imageToView || ''} alt="Payment Screenshot" layout="fill" objectFit="contain" /></div></DialogContent>
        </Dialog>

        <AlertDialog open={!!action} onOpenChange={(isOpen) => !isOpen && setAction(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to <span className={cn("font-semibold", action?.type === 'reject' && "text-destructive")}>{action?.type}</span> this deposit of <span className="font-bold">₹{action?.request.amount}</span>?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProcessRequest} disabled={isSubmitting} className={cn(action?.type === 'reject' && "bg-destructive text-destructive-foreground")}>
                        {isSubmitting ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
