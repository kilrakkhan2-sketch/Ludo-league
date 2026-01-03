
'use client';

import { useState } from 'react';
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
import { mockUsers } from '@/lib/data';
import { CheckCircle2, Download, Eye, QrCode, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const mockWithdrawalRequests = [
  {
    id: 'wd-1',
    user: mockUsers[0],
    amount: 1200,
    date: '2024-07-28T10:00:00Z',
    status: 'pending',
    upiId: 'playerone@exampleupi',
  },
  {
    id: 'wd-2',
    user: mockUsers[2],
    amount: 500,
    date: '2024-07-28T06:00:00Z',
    status: 'pending',
    upiId: 'playerthree@exampleupi',
  },
];

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
  const [requests, setRequests] = useState(mockWithdrawalRequests);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting the request.',
        variant: 'destructive',
      });
      return false;
    }

    const request = requests.find(req => req.id === id);
    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `${action === 'approve' ? 'Payment of' : 'Request for'} ₹${request?.amount} for ${request?.user.name} has been processed.`,
      variant: action === 'approve' ? 'default' : 'destructive',
      className: action === 'approve' ? 'bg-green-100 text-green-800' : ''
    });

    setRequests(requests.filter(req => req.id !== id));
    setRejectionReason('');
    return true;
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
                <TableHead>UPI ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(request => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.user.avatarUrl} />
                        <AvatarFallback>
                          {request.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{request.amount}
                  </TableCell>
                  <TableCell>{request.upiId}</TableCell>
                  <TableCell>
                    {new Date(request.date).toLocaleString()}
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
                            Withdrawal for {request.user.name}
                          </DialogTitle>
                          <DialogDescription>
                            Scan the QR code to complete the payment via UPI. Verify name match before proceeding.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <UpiQrCode
                            upiId={request.upiId}
                            amount={request.amount}
                          />
                          <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Rejection Reason (if any)</Label>
                            <Input
                                id="rejection-reason"
                                placeholder="e.g., Insufficient funds, invalid UPI"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction(request.id, 'reject')}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                variant="accent"
                                onClick={() => handleAction(request.id, 'approve')}
                                >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Mark as Paid
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
                {requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No pending withdrawal requests.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
