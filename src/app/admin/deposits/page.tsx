
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
import { CheckCircle2, Eye, XCircle, Loader2 } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { collection, onSnapshot, query, where, doc, updateDoc, writeBatch, serverTimestamp, orderBy } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "@/lib/types";

// We need to fetch user data for each transaction, so a combined type is useful
interface DepositTransaction extends Transaction {
    user?: { displayName: string; photoURL: string; };
    utr?: string;
    screenshotUrl?: string;
}

export default function AdminDepositsPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [requests, setRequests] = useState<DepositTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const transRef = collection(firestore, 'transactions');
    const q = query(
        transRef, 
        where('type', '==', 'deposit'), 
        where('status', '==', 'pending'), 
        orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const dataPromises = snapshot.docs.map(async (docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() } as DepositTransaction;
            
            // Fetch user data for each transaction to display name and avatar
            if (data.userId) {
                const userRef = doc(firestore, 'users', data.userId);
                const userSnap = await userRef.firestore.collection('users').doc(data.userId).get();
                if(userSnap.exists()) {
                    const userData = userSnap.data();
                    data.user = {
                        displayName: userData.displayName,
                        photoURL: userData.photoURL,
                    };
                }
            }
            return data;
        });

        const resolvedData = await Promise.all(dataPromises);
        setRequests(resolvedData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching deposit requests: ", error);
        toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);

  const handleAction = async (request: DepositTransaction, action: 'approve' | 'reject') => {
    if (!firestore || !adminUser) return;
    setProcessingId(request.id);
    
    const requestRef = doc(firestore, 'transactions', request.id);
    
    try {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        await updateDoc(requestRef, { status: newStatus, reviewedAt: serverTimestamp(), reviewedBy: adminUser.uid });

        // The balance update is now handled by the `handleTransaction` cloud function.
        
        toast({
            title: `Request ${newStatus}`,
            description: `Deposit for ${request.user?.displayName} has been ${newStatus}.`,
            className: action === 'approve' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        });

    } catch (error: any) {
        console.error(`Error ${action}ing deposit:`, error);
        toast({ title: `Failed to ${action} request`, description: error.message, variant: 'destructive' });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Deposit Requests</h2>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pending Deposits</CardTitle>
          <CardDescription>
            Review and approve or reject user deposit requests. The user's balance will be updated automatically on approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Screenshot</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></TableCell></TableRow>}
                {!loading && requests.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending deposit requests.</TableCell></TableRow>}
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
                  <TableCell className="font-mono text-xs">{request.utr}</TableCell>
                  <TableCell>{request.createdAt?.toDate().toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2"/> View
                        </a>
                    </Button>
                  </TableCell>
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

    