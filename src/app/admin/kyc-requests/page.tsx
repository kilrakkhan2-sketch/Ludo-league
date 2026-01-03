'use client';
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { CheckCircle2, Download, Eye, Loader2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useFirestore } from "@/firebase"
import { collection, onSnapshot, query, where, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import type { KycApplication } from "@/lib/types";


export default function AdminKycRequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [requests, setRequests] = useState<KycApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const kycRef = collection(firestore, 'kycApplications');
        const q = query(kycRef, where('status', '==', 'pending'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycApplication));
            setRequests(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleAction = async (request: KycApplication, action: 'approve' | 'reject') => {
        if (!firestore) return;

        if (action === 'reject' && !rejectionReason) {
            toast({ title: 'Please provide a reason for rejection.', variant: 'destructive' });
            return;
        }

        setProcessingId(request.id);

        try {
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', request.userId);
            const kycRef = doc(firestore, 'kycApplications', request.id);
            const reviewedAt = serverTimestamp();

            if (action === 'approve') {
                batch.update(userRef, { kycStatus: 'approved' });
                batch.update(kycRef, { status: 'approved', reviewedAt });
                toast({ title: `KYC for ${request.userName} approved!`, className: "bg-green-100 text-green-800"});
            } else {
                batch.update(userRef, { kycStatus: 'rejected', kycRejectionReason: rejectionReason });
                batch.update(kycRef, { status: 'rejected', rejectionReason: rejectionReason, reviewedAt });
                toast({ title: `KYC for ${request.userName} rejected.`, variant: 'destructive' });
            }

            await batch.commit();
            setRejectionReason('');

        } catch (error: any) {
            console.error("Error processing KYC:", error);
            toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    }

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">KYC Requests</h2>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending KYC Submissions</CardTitle>
          <CardDescription>
            Review and process new KYC requests from users. Verify that the user's name matches on all documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Submission Date</TableHead>
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
                        <AvatarFallback>{request.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{request.submittedAt?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog onOpenChange={(open) => !open && setRejectionReason('')}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2"/> Review
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Review KYC: {request.userName}</DialogTitle>
                                <DialogDescription>
                                    Verify the user's documents and bank details. Ensure name consistency.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto p-2">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">ID Proof (Aadhaar/PAN)</h4>
                                    <div className="relative group border rounded-lg overflow-hidden">
                                         <Image src={request.aadhaarPanUrl} alt="ID Proof" width={800} height={500} className="object-contain"/>
                                         <a href={request.aadhaarPanUrl} download target="_blank" className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className="h-5 w-5" />
                                         </a>
                                    </div>
                                    <h4 className="font-semibold">Selfie</h4>
                                     <div className="relative group border rounded-lg overflow-hidden">
                                        <Image src={request.selfieUrl} alt="Selfie" width={600} height={600} className="object-contain"/>
                                        <a href={request.selfieUrl} download target="_blank" className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className="h-5 w-5" />
                                         </a>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Bank / UPI Details</h4>
                                    <div className="p-4 bg-muted rounded-md text-sm space-y-2">
                                        {request.bankDetails && <div><p className="font-medium text-muted-foreground">Bank Details:</p><p className="whitespace-pre-wrap">{request.bankDetails}</p></div>}
                                        {request.upiId && <div><p className="font-medium text-muted-foreground">UPI ID:</p><p>{request.upiId}</p></div>}
                                        {!request.bankDetails && !request.upiId && <p>Not provided.</p>}
                                    </div>

                                    <div className="space-y-2 pt-4">
                                        <Label htmlFor="rejection-reason" className="text-base font-semibold">Rejection Reason (if any)</Label>
                                        <Textarea 
                                            id="rejection-reason" 
                                            placeholder="e.g., Selfie is blurry, ID document is expired."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-4 border-t">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => handleAction(request, 'reject')} disabled={!rejectionReason || processingId === request.id}>
                                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>} Reject
                                </Button>
                                <Button variant="accent" onClick={() => handleAction(request, 'approve')} disabled={processingId === request.id}>
                                   {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>} Approve
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
