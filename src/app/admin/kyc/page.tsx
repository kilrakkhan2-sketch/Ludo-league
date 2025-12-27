
'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { KycRequest, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getStatusBadge = (status: KycRequest['status']) => {
    switch (status) {
        case 'approved': return <Badge variant="success" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>;
        case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
        case 'pending':
        default: return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
};

export default function KycManagementPage() {
    const { data: requests, loading, refetch } = useCollection<KycRequest>('kyc_requests', { orderBy: ['createdAt', 'desc'] });
    const { firestore } = useFirebase();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | KycRequest['status']>('pending');

    const handleStatusChange = async (reqId: string, userId: string, newStatus: KycRequest['status']) => {
        if (!firestore) return;
        if (newStatus === 'rejected' && !rejectionReason) {
            toast({ variant: 'destructive', title: 'Rejection Reason Required', description: 'Please provide a reason for rejection.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const reqRef = doc(firestore, 'kyc_requests', reqId);
            const userRef = doc(firestore, 'users', userId);

            await updateDoc(reqRef, {
                status: newStatus,
                processedAt: new Date(),
                ...(newStatus === 'rejected' && { rejectionReason })
            });

            if (newStatus === 'approved') {
                await updateDoc(userRef, { isVerified: true });
            }
            
            toast({ title: `Request ${newStatus}`, description: 'The user profile has been updated accordingly.' });
            refetch();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
            setRejectionReason('');
        }
    };

    const filteredRequests = requests.filter(req => activeFilter === 'all' || req.status === activeFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">KYC Management</h1>
                    <p className="text-muted-foreground">Review and process user KYC submissions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Verification Requests</CardTitle>
                    <CardDescription>
                        <div className="flex items-center justify-between pt-2">
                            <p>Showing {filteredRequests.length} of {requests.length} total requests.</p>
                            <Select value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)}>
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Document Type</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ? [...Array(5)].map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                            )) : filteredRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.fullName} <span className="text-muted-foreground text-xs">({req.userId.substring(0,5)}...)</span></TableCell>
                                    <TableCell>{req.documentType}</TableCell>
                                    <TableCell>{req.createdAt ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild><a href={req.documentFrontImage} target="_blank" rel="noopener noreferrer" className="flex items-center"><Download className="mr-2 h-4 w-4" /> View Document (Front)</a></DropdownMenuItem>
                                                {req.documentBackImage && <DropdownMenuItem asChild><a href={req.documentBackImage} target="_blank" rel="noopener noreferrer" className="flex items-center"><Download className="mr-2 h-4 w-4" /> View Document (Back)</a></DropdownMenuItem>}
                                                {req.status !== 'approved' && <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.userId, 'approved')} disabled={isSubmitting}>Approve</DropdownMenuItem>}
                                                {req.status !== 'rejected' && <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.userId, 'rejected')} disabled={isSubmitting}>Reject</DropdownMenuItem>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No requests found for the "{activeFilter}" filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {activeFilter === 'pending' && <div className="mt-4"><Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide rejection reason before rejecting..." /></div>}
                </CardContent>
            </Card>
        </div>
    );
}
