
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { KycRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
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


export default function AdminKycPage() {
  const { firestore } = useFirebase();
  const functions = useFunctions();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: ['status', '==', statusFilter] as const
  }), [statusFilter]);
  const { data: requests, loading } = useCollection<KycRequest>('kyc-requests', queryOptions);

  const handleProcessRequest = async (request: KycRequest, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !adminUser) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      
      const kycRequestRef = doc(firestore, 'kyc-requests', request.id);
      batch.update(kycRequestRef, { 
          status: newStatus, 
          processedAt: Timestamp.now(),
          processedBy: adminUser.uid,
      });

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

  const handleDeleteDocument = async (documentUrl: string) => {
    if (!functions) return;
    if (!window.confirm('Are you sure you want to permanently delete this document?')) return;

    setIsSubmitting(true);
    try {
        const deleteStorageFile = httpsCallable(functions, 'deleteStorageFile');
        const filePath = new URL(documentUrl).pathname.split('/o/')[1].split('?')[0];
        await deleteStorageFile({ filePath: decodeURIComponent(filePath) });
        toast({ title: 'Document Deleted', description: 'The document has been permanently removed from storage.' });
    } catch(error: any) {
        console.error("Error deleting document:", error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message || 'Could not delete the document.' });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const isLoading = loading;

  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">KYC Management</h1>

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
        ) : requests.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No {statusFilter} KYC requests found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((request: KycRequest) => (
                    <Card key={request.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle><UserCell userId={request.userId} /></CardTitle>
                                <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                            </div>
                             <div className="text-sm text-muted-foreground capitalize">
                                {request.documentType.replace('_', ' ')}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">
                                Submitted on {request.createdAt ? format((request.createdAt as Timestamp).toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Dialog open={selectedRequest?.id === request.id} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className='w-full' onClick={() => setSelectedRequest(request)}>Review</Button>
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
                                         <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleDeleteDocument(selectedRequest.documentUrl)} disabled={isSubmitting}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Document
                                        </Button>
                                    </div>
                                   )}
                                  {request.status === 'pending' && (
                                      <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                                          <Button className='w-full' variant="destructive" onClick={() => handleProcessRequest(request, 'rejected')} disabled={isSubmitting}><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                          <Button className='w-full' onClick={() => handleProcessRequest(request, 'approved')} disabled={isSubmitting}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                      </DialogFooter>
                                  )}
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
