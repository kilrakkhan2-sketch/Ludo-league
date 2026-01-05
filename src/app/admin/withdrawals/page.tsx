
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
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, doc, writeBatch, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';

interface WithdrawalTransaction extends Transaction {
    user?: { displayName: string; photoURL: string; };
}

const UpiQrCode = ({ upiId, amount, name }: { upiId: string; amount: number; name: string }) => {
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(
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
  const { user: adminUser } = useUser();
  const [requests, setRequests] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const transRef = collection(firestore, 'transactions');
    const q = query(
      transRef,
      where('type', '==', 'withdrawal'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const dataPromises = snapshot.docs.map(async (docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as WithdrawalTransaction;
        const userSnap = await docSnap.ref.firestore.collection('users').doc(data.userId).get();
        if (userSnap.exists()) {
          data.user = {
            displayName: userSnap.data().displayName,
            photoURL: userSnap.data().photoURL,
          };
        }
        return data;
      });

      const resolvedData = await Promise.all(dataPromises);
      setRequests(resolvedData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching withdrawal requests: ", error);
      toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);

  const handleAction = async (request: WithdrawalTransaction, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser) return;

    if (action === 'reject' && !rejectionReason) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting the request.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingId(request.id);
    const requestRef = doc(firestore, 'transactions', request.id);

    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const batch = writeBatch(firestore);
      
      const updateData: any = {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUser.uid
      };

      if(action === 'reject') {
        updateData.rejectionReason = rejectionReason;
      }

      batch.update(requestRef, updateData);
      
      // Note: The cloud function `handleTransaction` will trigger on this status change 
      // and will decrease the user's balance if the request is approved.
      await batch.commit();

      toast({
        title: `Request ${newStatus}`,
        description: `Withdrawal for ${request.user?.displayName} has been ${newStatus}.`,
        className: action === 'approve' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      });

      setRejectionReason('');
    } catch (error: any) {
      console.error(`Error ${action}ing withdrawal:`, error);
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
            Review and process user withdrawal requests. The user's balance will be updated automatically on approval.
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
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></TableCell></TableRow>}
              {!loading && requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No pending withdrawal requests.
                        </TableCell>
                    </TableRow>
                )}
              {!loading && requests.map(request => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="border">
                        <AvatarImage src={request.user?.photoURL} />
                        <AvatarFallback>
                          {request.user?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.user?.displayName || 'Unknown User'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{request.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{request.upiId || 'Bank Transfer'}</TableCell>
                  <TableCell>
                    {request.createdAt?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog onOpenChange={() => setRejectionReason('')}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Withdrawal for {request.user?.displayName}
                          </DialogTitle>
                          <DialogDescription>
                            Scan the QR code to complete the payment via UPI, or use bank details. Verify name match before proceeding.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          {request.upiId ? (
                            <UpiQrCode
                                upiId={request.upiId}
                                amount={request.amount}
                                name={request.user?.displayName || 'User'}
                            />
                          ) : (
                            <div className="p-4 bg-muted rounded-md border">
                                <h4 className="font-semibold mb-2">Bank Details</h4>
                                <p className="text-sm whitespace-pre-wrap">{request.bankDetails}</p>
                            </div>
                          )}
                          <div className="space-y-2 pt-4">
                            <Label htmlFor="rejection-reason" className="font-semibold">Rejection Reason (if any)</Label>
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
                                    disabled={!rejectionReason || processingId === request.id}
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
