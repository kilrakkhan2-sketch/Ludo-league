
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { KycRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
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


export default function AdminKycPage() {
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'],
    where: ['status', '==', statusFilter]
  }), [statusFilter]);
  const { data: requests, loading } = useCollection<KycRequest>('kyc-requests', queryOptions);

  const handleProcessRequest = async (request: KycRequest, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !adminUser) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      
      // Update the KYC request itself
      const kycRequestRef = doc(firestore, 'kyc-requests', request.id);
      batch.update(kycRequestRef, { 
          status: newStatus, 
          processedAt: Timestamp.now(),
          processedBy: adminUser.uid,
      });

      // If approved, update the user's profile
      if (newStatus === 'approved') {
          const userRef = doc(firestore, 'users', request.userId);
          batch.update(userRef, { isVerified: true });
      }
      
      await batch.commit();
      
      toast({ title: 'Success', description: `KYC request has been ${newStatus}.` });

    } catch (error: any) {
      console.error(`Error ${newStatus} KYC:`, error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || `Could not process KYC request.` });
    } finally {
      setIsSubmitting(false);
      setSelectedRequest(null);
    }
  };
  
  const isLoading = loading;

  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">KYC Management</h1>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>KYC Requests</CardTitle>
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
                  <TableHead>Document Type</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  {statusFilter !== 'pending' && <TableHead>Processed By</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : requests.length === 0 ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">No {statusFilter} KYC requests found.</TableCell></TableRow>
                ) : requests.map((request: KycRequest) => {
                  return (
                    <TableRow key={request.id}>
                      <TableCell><UserCell userId={request.userId} /></TableCell>
                      <TableCell className='capitalize'>{request.documentType.replace('_', ' ')}</TableCell>
                      <TableCell>{request.createdAt ? format((request.createdAt as Timestamp).toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                      {statusFilter !== 'pending' && <TableCell><ProcessorCell userId={request.processedBy} /></TableCell>}
                      <TableCell><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                      <TableCell className="text-right">
                          <Dialog open={selectedRequest?.id === request.id} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                  <DialogHeader>
                                      <DialogTitle>Review KYC Submission</DialogTitle>
                                      <DialogDescription>Verify the user's information and submitted document.</DialogDescription>
                                  </DialogHeader>
                                   {selectedRequest && (
                                     <div className='space-y-4'>
                                        <p><strong>User:</strong> <UserCell userId={selectedRequest.userId} /></p>
                                        <p><strong>Full Name:</strong> <span className="font-semibold">{selectedRequest.fullName}</span></p>
                                        <p><strong>Document:</strong> <span className="font-semibold">{selectedRequest.documentType.replace('_', ' ')} - {selectedRequest.documentNumber}</span></p>
                                         <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                              <Image src={selectedRequest.documentUrl} alt="KYC Document" layout="fill" objectFit="contain" />
                                          </div>
                                    </div>
                                   )}
                                  {request.status === 'pending' && (
                                      <DialogFooter className="pt-4">
                                          <Button variant="destructive" onClick={() => handleProcessRequest(request, 'rejected')} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                          <Button onClick={() => handleProcessRequest(request, 'approved')} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
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
