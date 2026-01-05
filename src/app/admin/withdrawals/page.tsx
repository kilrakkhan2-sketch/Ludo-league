
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
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, writeBatch, serverTimestamp, orderBy } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Transaction, UserProfile } from "@/lib/types";

interface WithdrawalTransaction extends Transaction {
    user?: { 
        displayName: string; 
        photoURL: string; 
        upiId?: string; 
        bankDetails?: { accountholder: string; accountNumber: string; ifsc: string; }; 
    };
}

export default function AdminWithdrawalsPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [requests, setRequests] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
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
            
            if (data.userId) {
                const userRef = doc(firestore, 'users', data.userId);
                const userSnap = await getDoc(userRef);
                if(userSnap.exists()) {
                    const userData = userSnap.data() as UserProfile;
                    data.user = {
                        displayName: userData.displayName,
                        photoURL: userData.photoURL,
                        upiId: userData.upiId,
                        bankDetails: userData.bankDetails,
                    };
                }
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

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser) return;
    setProcessingId(requestId);
    
    const requestRef = doc(firestore, 'transactions', requestId);
    
    try {
        const newStatus = action === 'approve' ? 'completed' : 'rejected';
        
        // The user's balance is NOT adjusted here. 
        // On approval, the balance is deducted by the cloud function `handleTransaction` after this status update.
        // On rejection, the balance is untouched.
        await updateDoc(requestRef, { 
            status: newStatus, 
            reviewedAt: serverTimestamp(), 
            reviewedBy: adminUser.uid 
        });
        
        toast({
            title: `Request ${newStatus}`,
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
                            <AvatarImage src={request.user?.photoURL} />
                            <AvatarFallback>{request.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{request.user?.displayName || 'Unknown User'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{request.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                        {request.user?.upiId ? (
                            <div className="text-xs">
                                <p className="font-semibold">UPI</p>
                                <p>{request.user.upiId}</p>
                            </div>
                        ) : request.user?.bankDetails ? (
                            <div className="text-xs">
                                <p className="font-semibold">Bank Transfer</p>
                                <p><strong>A/C:</strong> {request.user.bankDetails.accountNumber}</p>
                                <p><strong>IFSC:</strong> {request.user.bankDetails.ifsc}</p>
                            </div>
                        ) : <p className="text-xs text-muted-foreground">No details</p>}
                    </TableCell>
                    <TableCell>{request.createdAt?.toDate().toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700" onClick={() => handleAction(request.id, 'approve')} disabled={processingId === request.id}>
                                {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</>}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAction(request.id, 'reject')} disabled={processingId === request.id}>
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
