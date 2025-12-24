
"use client";

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useFirebase, useCollection } from '@/firebase';
import { KycRequest, UserProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

type KYCStatus = 'pending' | 'approved' | 'rejected';

export default function KycManagementPage() {
  const { firestore } = useFirebase(); // Correctly get firestore instance
  const [kycRequests, setKycRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const userMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.uid] = user;
      return acc;
    }, {} as { [key: string]: UserProfile });
  }, [users]);

  useEffect(() => {
    if (!firestore) return;
    const unsubscribe = onSnapshot(collection(firestore, 'kyc_requests'), (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycRequest));
      setKycRequests(requests);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleStatusChange = async (requestId: string, userId: string, newStatus: KYCStatus) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      const kycRequestRef = doc(firestore, 'kyc_requests', requestId);
      const userRef = doc(firestore, 'users', userId);

      batch.update(kycRequestRef, { status: newStatus, processedAt: Timestamp.now() });
      batch.update(userRef, { 
          isVerified: newStatus === 'approved',
          // You might want to store more KYC details on the user doc upon approval
      });

      await batch.commit();
      toast({ title: 'Success', description: `KYC request has been ${newStatus}.` });
    } catch (error: any) {
      console.error(`Error processing KYC:`, error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || `Could not process KYC request.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || usersLoading) {
    return <div>Loading KYC requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Management</h1>
        <p className="text-muted-foreground">Review and process user-submitted identity documents.</p>
      </div>

      {kycRequests.length === 0 ? (
         <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>
                There are currently no new KYC requests to review. When users submit documents, they will appear here.
            </AlertDescription>
        </Alert>
      ) : (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {kycRequests.map((req) => (
                <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.userId}</TableCell>
                    <TableCell>{userMap[req.userId]?.displayName || 'Unknown User'}</TableCell>
                    <TableCell>{req.documentType}</TableCell>
                    <TableCell><Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>{req.status}</Badge></TableCell>
                    <TableCell>{req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><a href={req.documentFrontImage} target="_blank" rel="noopener noreferrer" className="flex items-center"><Download className="mr-2 h-4 w-4" /> View Document</a></DropdownMenuItem>
                                {req.status !== 'approved' && <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.userId, 'approved')} disabled={isSubmitting}>Approve</DropdownMenuItem>}
                                {req.status !== 'rejected' && <DropdownMenuItem onClick={() => handleStatusChange(req.id, req.userId, 'rejected')} disabled={isSubmitting}>Reject</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
      )}
    </div>
  );
}
