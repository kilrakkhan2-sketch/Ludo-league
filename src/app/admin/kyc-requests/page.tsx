
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


interface KycRequest extends KycApplication {
    id: string;
    user?: { 
        displayName: string; 
        photoURL: string; 
    };
}

const KycDetailModal = ({
    request,
    isOpen,
    onOpenChange,
    onAction,
  }: {
    request: KycRequest;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAction: (id: string, action: 'approve' | 'reject', reason?: string) => void;
  }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>KYC Application Details</DialogTitle>
            <DialogDescription>Review the user's submitted KYC information.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                    <AvatarImage src={request.user?.photoURL} />
                    <AvatarFallback>{request.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-lg">{request.user?.displayName}</p>
                    <p className="text-sm text-muted-foreground">User ID: {request.userId}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                    <p className="font-medium text-muted-foreground">Full Name:</p>
                    <p>{request.fullName}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Date of Birth:</p>
                    <p>{new Date(request.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Aadhaar Number:</p>
                    <p>{request.aadhaarNumber}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">PAN Number:</p>
                    <p>{request.panNumber}</p>
                </div>
            </div>

            <div className="pt-4 border-t">
                <p className="font-medium text-muted-foreground">Document Images:</p>
                <div className="flex gap-4 mt-2">
                    <a href={request.aadhaarImage} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Aadhaar</a>
                    <a href={request.panImage} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View PAN</a>
                </div>
            </div>

            <div className="pt-4 border-t">
                <p className="font-medium text-muted-foreground">Payment Details:</p>
                {request.bankDetails && <div><p className="font-medium text-muted-foreground">Bank Details:</p><p className="whitespace-pre-wrap">{request.bankDetails}</p></div>}
                {request.upiId && <div><p className="font-medium text-muted-foreground">UPI ID:</p><p>{request.upiId}</p></div>}
                {!request.bankDetails && !request.upiId && <p>Not provided.</p>}
            </div>

          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex-grow">
                <Button variant="destructive" onClick={() => onAction(request.id, 'reject')}>Reject</Button>
            </div>
            <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={() => onAction(request.id, 'approve')}>
              Approve
            </Button>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        const dataPromises = snapshot.docs.map(async (docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() } as KycRequest;
            
            if (data.userId) {
                const userRef = doc(firestore, 'users', data.userId);
                const userSnap = await getDoc(userRef);
                if(userSnap.exists()) {
                    data.user = {
                        displayName: userSnap.data().displayName,
                        photoURL: userSnap.data().photoURL,
                    };
                }
            }
            return data;
        });

        const resolvedData = await Promise.all(dataPromises);
        setRequests(resolvedData);
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

    // On approval, update the user's main profile with KYC status and payment details
    if (action === 'approve') {
        batch.update(userRef, {
            kycStatus: 'approved',
            upiId: kycData.upiId || null,
            bankDetails: kycData.bankDetails || null
        });
    } else {
        batch.update(userRef, {
            kycStatus: 'rejected'
        });
    }

    try {
        await batch.commit();
        toast({ title: `Request ${newStatus}` });
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
                <TableHead>Full Name</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></TableCell></TableRow>}
                {!loading && requests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending KYC requests.</TableCell></TableRow>}
                {!loading && requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="border">
                                <AvatarImage src={request.user?.photoURL} />
                                <AvatarFallback>{request.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{request.user?.displayName || 'Unknown User'}</span>
                        </div>
                    </TableCell>
                    <TableCell>{request.fullName}</TableCell>
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
        />
      )}
    </>
  )
}
