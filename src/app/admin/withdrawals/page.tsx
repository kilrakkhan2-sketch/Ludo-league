
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
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, writeBatch, serverTimestamp, orderBy, runTransaction } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { WithdrawalRequest, UserProfile } from "@/lib/types";

export default function AdminWithdrawalsPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const withdrawalRequestsRef = collection(firestore, 'withdrawalRequests');
    const q = query(
        withdrawalRequestsRef, 
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as WithdrawalRequest));
        setRequests(data);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching withdrawal requests: ", error);
        toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);

  const handleAction = async (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser) return;
    setProcessingId(request.id);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const requestRef = doc(firestore, 'withdrawalRequests', request.id);

            if (action === 'approve') {
                const userRef = doc(firestore, 'users', request.userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User not found");
                
                const currentBalance = userDoc.data().walletBalance || 0;
                if (currentBalance < request.amount) {
                    throw new Error('User has insufficient balance for this withdrawal.');
                }
                
                const transactionRef = doc(collection(firestore, 'transactions'));
                
                // Mark request as approved
                transaction.update(requestRef, { 
                    status: 'approved', 
                    reviewedAt: serverTimestamp(), 
                    reviewedBy: adminUser.uid 
                });

                // Create a transaction log. The onTransactionCreate Cloud Function will handle the balance update.
                transaction.set(transactionRef, {
                    userId: request.userId,
                    type: 'withdrawal',
                    amount: -request.amount,
                    status: 'completed',
                    createdAt: serverTimestamp(),
                    description: `Withdrawal to ${request.upiId || 'Bank Account'}`
                });
            } else { // Reject
                transaction.update(requestRef, { 
                    status: 'rejected', 
                    reviewedAt: serverTimestamp(), 
                    reviewedBy: adminUser.uid,
                    // TODO: Add rejection reason input
                });
            }
        });
        
        toast({
            title: `Request ${action}d`,
            description: `Withdrawal for ${request.userName} has been ${action}d.`,
            className: action === 'approve' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        });

    } catch (error: any) {
        console.error(`Error ${action}ing withdrawal:`, error);
        toast({ title: `Failed to ${action} request`, description: error.message, variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Withdrawal Requests</h2>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>
            Review and approve or reject user withdrawal requests. The user's balance will be updated automatically on approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></TableCell></TableRow>}
                {!loading && requests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending withdrawal requests.</TableCell></TableRow>}
                {!loading && requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="border">
                            <AvatarImage src={(request as any).user?.photoURL} />
                            <AvatarFallback>{request.userName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{request.userName || 'Unknown User'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{request.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                        {request.upiId ? (
                            <div className="text-xs">
                                <p className="font-semibold">UPI</p>
                                <p>{request.upiId}</p>
                            </div>
                        ) : request.bankDetails ? (
                            <div className="text-xs">
                                <p className="font-semibold">Bank Transfer</p>
                                <p className="whitespace-pre-wrap">{request.bankDetails}</p>
                            </div>
                        ) : <p className="text-xs text-muted-foreground">Not provided</p>}
                    </TableCell>
                    <TableCell>{request.createdAt?.toDate().toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700" onClick={() => handleAction(request, 'approve')} disabled={processingId === request.id}>
                                {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</>}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAction(request, 'reject')} disabled={processingId === request.id}>
                                {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><XCircle className="h-4 w-4 mr-2" /> Reject</>}
                            </Button>
                        </div>
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

    