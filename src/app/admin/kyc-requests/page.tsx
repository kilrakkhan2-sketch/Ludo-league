
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Eye, XCircle, Loader2 } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, writeBatch, serverTimestamp, orderBy } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { KycApplication, UserProfile } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  } from '@/components/ui/dialog';
import NoSsr from "@/components/NoSsr";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface KycRequest extends KycApplication {
    id: string;
    userName?: string;
    userAvatar?: string;
}

const KycDetailModal = ({
    request,
    isOpen,
    onOpenChange,
    onAction,
    isProcessing,
  }: {
    request: KycRequest;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAction: (id: string, action: 'approve' | 'reject', reason?: string) => void;
    isProcessing: boolean;
  }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleReject = () => {
        if (!rejectionReason) {
            alert("Please provide a reason for rejection.");
            return;
        }
        onAction(request.id, 'reject', rejectionReason);
    }

    return (
    <NoSsr>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>KYC Application Details</DialogTitle>
            <DialogDescription>Review the user's submitted KYC information.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                    <AvatarImage src={request.userAvatar} />
                    <AvatarFallback>{request.userName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-lg">{request.userName}</p>
                    <p className="text-sm text-muted-foreground">User ID: {request.userId}</p>
                </div>
            </div>

            <div className="pt-4 border-t">
                <p className="font-medium text-muted-foreground">Document Images:</p>
                <div className="flex gap-4 mt-2">
                    <a href={request.aadhaarPanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View ID Proof</a>
                    <a href={request.selfieUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Selfie</a>
                </div>
            </div>

            <div className="pt-4 border-t">
                <p className="font-medium text-muted-foreground">Payment Details:</p>
                {request.bankDetails && <div className="text-sm"><p className="font-semibold">Bank Details:</p><p className="whitespace-pre-wrap">{request.bankDetails}</p></div>}
                {request.upiId && <div className="text-sm"><p className="font-semibold">UPI ID:</p><p>{request.upiId}</p></div>}
                {!request.bankDetails && !request.upiId && <p className="text-sm text-muted-foreground">Not provided.</p>}
            </div>

            <div className="pt-4 border-t">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Input id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide a clear reason for rejection..."/>
            </div>

          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex-grow">
                <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reject'}
                </Button>
            </div>
            <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={() => onAction(request.id, 'approve')} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Approve'}
            </Button>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isProcessing}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </NoSsr>
    );
  };

export default function AdminKycPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const kycRef = collection(firestore, 'kycApplications');
    const q = query(kycRef, where('status', '==', 'pending'), orderBy('submittedAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as KycRequest));
        setRequests(data);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching KYC requests: ", error);
        toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);

  const handleAction = async (id: string, action: 'approve' | 'reject', reason: string = '') => {
    if (!firestore || !adminUser) return;
    if (action === 'reject' && !reason) {
        toast({ title: 'Rejection reason is required', variant: 'destructive' });
        return;
    }
    setProcessingId(id);

    const kycRef = doc(firestore, 'kycApplications', id);
    const kycData = requests.find(r => r.id === id);
    if(!kycData) return;

    const userRef = doc(firestore, 'users', kycData.userId);

    const batch = writeBatch(firestore);
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    batch.update(kycRef, { 
        status: newStatus, 
        reviewedAt: serverTimestamp(), 
        reviewedBy: adminUser.uid, 
        rejectionReason: action === 'reject' ? reason : null
    });

    if (action === 'approve') {
        batch.update(userRef, {
            kycStatus: 'approved',
            upiId: kycData.upiId || null,
            bankDetails: kycData.bankDetails || null,
            kycRejectionReason: null, // Clear any previous rejection reason
        });
    } else {
        batch.update(userRef, {
            kycStatus: 'rejected',
            kycRejectionReason: reason || 'Your KYC application was rejected. Please review your documents and resubmit.',
        });
    }

    try {
        await batch.commit();
        toast({ title: `Request ${newStatus}`, className: action === 'approve' ? 'bg-green-100 text-green-800' : ''});
        setSelectedRequest(null); // Close modal on success
    } catch (error: any) {
        console.error(`Error ${action}ing request:`, error);
        toast({ title: `Failed to ${action} request`, description: error.message, variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">KYC Requests</h2>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            Review and approve or reject user KYC applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></TableCell></TableRow>}
                {!loading && requests.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No pending KYC requests.</TableCell></TableRow>}
                {!loading && requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="border">
                                <AvatarImage src={request.userAvatar} />
                                <AvatarFallback>{request.userName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{request.userName || 'Unknown User'}</span>
                        </div>
                    </TableCell>
                    <TableCell>{request.submittedAt?.toDate().toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{request.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            <Eye className="h-4 w-4 mr-2"/> Review
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedRequest && (
        <KycDetailModal 
            request={selectedRequest} 
            isOpen={!!selectedRequest} 
            onOpenChange={() => setSelectedRequest(null)} 
            onAction={handleAction} 
            isProcessing={processingId === selectedRequest.id}
        />
      )}
    </>
  )
}
