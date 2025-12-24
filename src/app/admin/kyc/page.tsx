
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { KycRequest, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye } from 'lucide-react';

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
    return <div className='font-medium'>{user?.displayName || 'Unknown User'}</div>;
}

export default function AdminKycPage() {
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: ['status', '==', statusFilter] as const,
    limit: 50, // To prevent performance issues with large datasets
  }), [statusFilter]);
  const { data: requests, loading } = useCollection<KycRequest>('kyc-requests', queryOptions);

  const handleProcessRequest = async (request: KycRequest, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !adminUser || !window.confirm(`Are you sure you want to ${newStatus} this request?`)) return;
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
          batch.update(userRef, { isVerified: true, kycData: {
              fullName: request.fullName,
              documentType: request.documentType,
              documentNumber: request.documentNumber
          } });
      }
      
      await batch.commit();
      toast({ title: 'Success', description: `KYC request has been ${newStatus}.` });

    } catch (error: any) {
      console.error(`Error processing KYC:`, error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || `Could not process KYC request.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">KYC Management</h1>
            <p className="text-muted-foreground">Review and process user-submitted identity documents.</p>
        </div>

        <div className="flex space-x-2 border-b pb-4">
            <Button size="sm" variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending ({statusFilter === 'pending' ? requests?.length : ''})</Button>
            <Button size="sm" variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
            <Button size="sm" variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </div>

        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : requests?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No {statusFilter} requests found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map((request: KycRequest) => (
                            <TableRow key={request.id}>
                                <TableCell><UserCell userId={request.userId} /></TableCell>
                                <TableCell className="capitalize">{request.documentType.replace('_', ' ')}</TableCell>
                                <TableCell>{request.createdAt ? format((request.createdAt as Timestamp).toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => setImageToView(request.documentUrl)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Document</span>
                                    </Button>
                                    {request.status === 'pending' && (
                                        <>
                                            <Button variant="destructive" size="icon" onClick={() => handleProcessRequest(request, 'rejected')} disabled={isSubmitting}>
                                                <XCircle className="h-4 w-4" />
                                                <span className="sr-only">Reject</span>
                                            </Button>
                                            <Button variant="default" size="icon" onClick={() => handleProcessRequest(request, 'approved')} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="sr-only">Approve</span>
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Full Screen Image Viewer */}
        <Dialog open={!!imageToView} onOpenChange={(isOpen) => !isOpen && setImageToView(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>KYC Document Review</DialogTitle>
                </DialogHeader>
                <div className="flex-grow relative">
                    {imageToView && <Image src={imageToView} alt="KYC Document" layout="fill" objectFit="contain" />}
                </div>
            </DialogContent>
        </Dialog>
      </div>
  );
}
