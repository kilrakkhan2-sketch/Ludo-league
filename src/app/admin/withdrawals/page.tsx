
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { WithdrawalRequest, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Copy, ShieldCheck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFunctions } from '@/firebase/provider';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'approved': return 'success';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
};

const UserCell = ({ userId }: { userId: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${userId}`);
    if (loading) return <Skeleton className="h-5 w-24" />;
    return (
        <div className="flex flex-col">
            <div className='font-medium flex items-center gap-2'>
                {user?.displayName || 'Unknown User'}
                {user?.isVerified && <span title="KYC Verified"><ShieldCheck className="h-4 w-4 text-green-500" /></span>}
            </div>
            <span className='text-xs text-muted-foreground'>{user?.email}</span>
        </div>
    );
};

export default function AdminWithdrawalsPage() {
  const functions = useFunctions();
  const { toast } = useToast();
  const { user: adminUser } = useUser();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<{ type: 'approve' | 'reject', request: WithdrawalRequest } | null>(null);

  const queryOptions = useMemo(() => ({
    where: ['status', '==', statusFilter] as const,
    orderBy: ['createdAt', 'desc'] as const,
    limit: 50,
  }), [statusFilter]);
  const { data: requests, loading } = useCollection<WithdrawalRequest>('withdrawal-requests', queryOptions);

  const handleProcessRequest = async () => {
    if (!functions || !action) return;
    setIsSubmitting(true);
    const { type, request } = action;
    try {
      const callableFunction = type === 'approve' ? httpsCallable(functions, 'approveWithdrawal') : httpsCallable(functions, 'rejectWithdrawal');
      await callableFunction({ withdrawalId: request.id });
      toast({ title: 'Success', description: `Request has been ${type}d.` });
    } catch(error: any) {
      console.error(`Error ${type}ing withdrawal:`, error);
      toast({ variant: 'destructive', title: 'Processing Error', description: error.message || 'Could not process the request.' });
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  }
  
  const formatDetails = (details: any) => {
    if (!details) return 'N/A';
    if (typeof details === 'string') return details;
    if (details.upiId) return `${details.accountHolderName} (${details.upiId})`;
    if (details.bankAccountNumber) return `${details.accountHolderName} (A/C: ${details.bankAccountNumber}, IFSC: ${details.ifscCode})`;
    return JSON.stringify(details);
  };

  return (
        <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
            <p className="text-muted-foreground">Review and process user withdrawal requests.</p>
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
            <CardHeader>
                <CardTitle className="capitalize">{statusFilter} Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="hidden md:table-cell">Method & Details</TableHead>
                            <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && [...Array(5)].map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, c) => <TableCell key={c}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>)}
                        {!loading && requests?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No {statusFilter} withdrawals.</TableCell></TableRow>}
                        {!loading && requests?.map((req: WithdrawalRequest) => (
                            <TableRow key={req.id}>
                                <TableCell><UserCell userId={req.userId} /></TableCell>
                                <TableCell className="font-semibold text-red-600">-₹{req.amount.toLocaleString()}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="font-medium capitalize">{req.method}</div>
                                    <div className="flex items-center gap-2">
                                        <span className='font-mono text-xs text-muted-foreground'>{formatDetails(req.details)}</span>
                                        <Copy className='h-3 w-3 cursor-pointer' onClick={() => navigator.clipboard.writeText(formatDetails(req.details))} />
                                    </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm">{req.createdAt ? formatDistanceToNow((req.createdAt as any).toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    {req.status === 'pending' && (
                                        <div className="space-x-2">
                                            <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'reject', request: req })} disabled={isSubmitting}><XCircle className="h-4 w-4" /><span className="sr-only">Reject</span></Button>
                                            <Button size="icon" onClick={() => setAction({ type: 'approve', request: req })} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4" /><span className="sr-only">Approve</span></Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

         <AlertDialog open={!!action} onOpenChange={(isOpen) => !isOpen && setAction(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to <span className={cn("font-semibold", action?.type === 'reject' && "text-destructive")}>{action?.type}</span> a withdrawal of <span className="font-bold">₹{action?.request.amount}</span>.
                        For approvals, ensure you have completed the external transfer first. This action is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProcessRequest} disabled={isSubmitting} className={cn(action?.type === 'reject' ? "bg-destructive text-destructive-foreground" : "bg-green-600 text-green-foreground hover:bg-green-700")}>
                        {isSubmitting ? 'Processing...' : 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </div>
  );
}
