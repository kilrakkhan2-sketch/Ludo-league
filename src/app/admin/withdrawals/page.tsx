'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Download, Eye, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, writeBatch, Timestamp, runTransaction } from 'firebase/firestore';

type WithdrawalRequest = {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    createdAt: any;
    status: 'pending' | 'approved' | 'rejected';
    upiId: string;
    bankDetails: string;
};

const UpiQrCode = ({ upiId, amount }: { upiId: string; amount: number }) => {
  const upiUrl = `upi://pay?pa=${upiId}&pn=Ludo%20League%20Player&am=${amount.toFixed(
    2
  )}&cu=INR&tn=WithdrawalRequest`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    upiUrl
  )}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <p className="text-sm font-medium text-center">
        Scan to pay ₹{amount.toFixed(2)} to{' '}
        <span className="font-bold">{upiId}</span>
      </p>
      <Image
        src={qrUrl}
        alt={`QR Code for ${upiId}`}
        width={250}
        height={250}
        className="rounded-lg border bg-white"
      />
      <p className="text-xs text-muted-foreground text-center">
        Ensure you enter the exact amount. After payment, mark this request as
        approved.
      </p>
    </div>
  );
};

export default function AdminWithdrawalsPage() {
  const firestore = useFirestore();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

   useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const reqRef = collection(firestore, 'withdrawalRequests');
    const q = query(reqRef, where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
        setRequests(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);


  const handleAction = async (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    if(!firestore) return;
    
    if (action === 'reject' && !rejectionReason) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting the request.',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessingId(request.id);

    try {
        const requestRef = doc(firestore, 'withdrawalRequests', request.id);
        const userRef = doc(firestore, 'users', request.userId);

        if (action === 'approve') {
             await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User not found!");
                }
                const currentBalance = userDoc.data().walletBalance || 0;
                if (currentBalance < request.amount) {
                    throw new Error("User has insufficient balance for this withdrawal.");
                }
                const newBalance = currentBalance - request.amount;
                transaction.update(userRef, { walletBalance: newBalance });
                transaction.update(requestRef, { status: 'approved', reviewedAt: Timestamp.now() });

                const transactionRef = doc(collection(firestore, "transactions"));
                transaction.set(transactionRef, {
                    userId: request.userId,
                    type: "withdrawal",
                    amount: -request.amount,
                    status: "completed",
                    createdAt: Timestamp.now(),
                    description: `Withdrawal approved`
                });
            });
            toast({ title: 'Request Approved', description: `Payment of ₹${request.amount} for ${request.userName} marked as complete.` });
        } else { // Reject
            await writeBatch(firestore)
                .update(requestRef, { status: 'rejected', rejectionReason: rejectionReason, reviewedAt: Timestamp.now() })
                .commit();
            toast({ title: 'Request Rejected', variant: 'destructive' });
        }
        setRejectionReason('');

    } catch (error: any) {
        toast({ title: `Failed to ${action} request`, description: error.message, variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4 flex items-center gap-2">
        <Download className="h-8 w-8 text-primary" />
        Withdrawal Requests
      </h2>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>
            Review and process user withdrawal requests. Ensure the recipient&apos;s name matches their KYC details before payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-8">Loading requests...</TableCell></TableRow>}
              {!loading && requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No pending withdrawal requests.
                        </TableCell>
                    </TableRow>
                )}
              {!loading && requests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.userAvatar} />
                        <AvatarFallback>
                          {request.userName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{request.amount}
                  </TableCell>
                  <TableCell className="text-xs">{request.upiId || request.bankDetails}</TableCell>
                  <TableCell>
                    {request.createdAt?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Withdrawal for {request.userName}
                          </DialogTitle>
                          <DialogDescription>
                            Scan the QR code to complete the payment via UPI. Verify name match before proceeding.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          {request.upiId ? (
                            <UpiQrCode
                                upiId={request.upiId}
                                amount={request.amount}
                            />
                          ) : (
                            <div className="p-4 bg-muted rounded-md">
                                <h4 className="font-semibold mb-2">Bank Details</h4>
                                <p className="text-sm whitespace-pre-wrap">{request.bankDetails}</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Rejection Reason (if any)</Label>
                            <Input
                                id="rejection-reason"
                                placeholder="e.g., Name mismatch, invalid UPI"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction(request, 'reject')}
                                    disabled={processingId === request.id}
                                >
                                    {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />} Reject
                                </Button>
                                <Button
                                variant="accent"
                                onClick={() => handleAction(request, 'approve')}
                                disabled={processingId === request.id}
                                >
                                {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4" />} Approve & Mark as Paid
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
  );
}
