'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, writeBatch, increment } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, ShieldAlert, DollarSign, WalletCards, Swords } from 'lucide-react';

// Define types for the data
interface UserData {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    balance: number;
    kycVerified: boolean;
    isBlocked: boolean;
    createdAt: any;
}
interface Deposit {
    id: string; amount: number; status: string; createdAt: any; utr: string;
}
interface Withdrawal {
    id: string; amount: number; status: string; createdAt: any; method: string;
}
interface Match {
    id: string; prize: number; status: string; createdAt: any; winnerId?: string;
}

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { toast } = useToast();

    const [user, setUser] = useState<UserData | null>(null);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(0);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            try {
                // Fetch user details
                const userDocRef = doc(db, "users", userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as UserData);
                } else {
                    toast({ title: "Error", description: "User not found.", variant: "destructive" });
                }

                // Fetch deposits
                const depositsQuery = query(collection(db, "deposits"), where("userId", "==", userId), orderBy("createdAt", "desc"));
                const depositsSnapshot = await getDocs(depositsQuery);
                setDeposits(depositsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit)));

                // Fetch withdrawals
                const withdrawalsQuery = query(collection(db, "withdrawals"), where("userId", "==", userId), orderBy("createdAt", "desc"));
                const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
                setWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));

                // Fetch matches
                const matchesQuery = query(collection(db, "matches"), where("players", "array-contains", { uid: userId, displayName: userDoc.data()?.displayName, photoURL: userDoc.data()?.photoURL }), orderBy("createdAt", "desc"));
                const matchesSnapshot = await getDocs(matchesQuery);
                setMatches(matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));

            } catch (error) {
                console.error("Error fetching user data: ", error);
                toast({ title: "Error", description: "Failed to fetch user data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, toast]);

    const handleBlockToggle = async () => {
        if (!user) return;
        const userDocRef = doc(db, "users", userId);
        try {
            const newStatus = !user.isBlocked;
            await updateDoc(userDocRef, { isBlocked: newStatus });
            setUser({ ...user, isBlocked: newStatus });
            toast({ title: "Success", description: `User has been ${newStatus ? 'blocked' : 'unblocked'}.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
        }
    };

    const handleAdjustBalance = async (adjustmentType: 'add' | 'remove') => {
        if (!user || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a positive amount.", variant: "destructive"});
            return;
        }

        const finalAmount = adjustmentType === 'add' ? amount : -amount;

        try {
            const batch = writeBatch(db);
            const userDocRef = doc(db, "users", userId);
            const walletTxRef = doc(collection(db, "wallet_transactions"));

            batch.update(userDocRef, { balance: increment(finalAmount) });
            batch.set(walletTxRef, {
                userId,
                amount: finalAmount,
                type: adjustmentType === 'add' ? 'admin_credit' : 'admin_debit',
                reason,
                createdAt: new Date(),
            });

            await batch.commit();
            
            setUser({ ...user, balance: user.balance + finalAmount });
            toast({ title: "Success", description: `Balance adjusted successfully.` });
            // Reset form
            setAmount(0);
            setReason('');

        } catch (error) {
            console.error("Error adjusting balance: ", error);
            toast({ title: "Error", description: "Failed to adjust balance.", variant: "destructive" });
        }
    };
    

    if (loading) return <div>Loading user profile...</div>;
    if (!user) return <div>User not found.</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{user.displayName}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={user.kycVerified ? "success" : "secondary"}>{user.kycVerified ? "KYC Verified" : "Not Verified"}</Badge>
                                {user.isBlocked && <Badge variant="destructive">Blocked</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline"><DollarSign className="mr-2 h-4 w-4"/> Adjust Wallet</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adjust Wallet Balance</DialogTitle>
                                    <DialogDescription>
                                        Manually add or remove funds from the user's wallet.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="reason">Reason</Label>
                                        <Input id="reason" type="text" placeholder="e.g., Bonus credit, incorrect transaction refund" value={reason} onChange={(e) => setReason(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button variant="destructive" onClick={() => handleAdjustBalance('remove')}>Remove Funds</Button>
                                    </DialogClose>
                                     <DialogClose asChild>
                                        <Button variant="success" onClick={() => handleAdjustBalance('add')}>Add Funds</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button variant={user.isBlocked ? "secondary" : "destructive"} onClick={handleBlockToggle}>
                            <ShieldAlert className="mr-2 h-4 w-4"/> {user.isBlocked ? "Unblock" : "Block"} User
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="deposits">
                <TabsList>
                    <TabsTrigger value="deposits"><WalletCards className="mr-2 h-4 w-4"/> Deposits</TabsTrigger>
                    <TabsTrigger value="withdrawals"><DollarSign className="mr-2 h-4 w-4"/> Withdrawals</TabsTrigger>
                    <TabsTrigger value="matches"><Swords className="mr-2 h-4 w-4"/> Matches</TabsTrigger>
                </TabsList>
                <TabsContent value="deposits">
                     <Table>
                        <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>UTR</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {deposits.map(d => <TableRow key={d.id}><TableCell>₹{d.amount}</TableCell><TableCell>{d.utr}</TableCell><TableCell><Badge variant={d.status === 'approved' ? 'success' : d.status === 'pending' ? 'secondary' : 'destructive'}>{d.status}</Badge></TableCell><TableCell>{d.createdAt.toDate().toLocaleString()}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </TabsContent>
                 <TabsContent value="withdrawals">
                     <Table>
                        <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {withdrawals.map(w => <TableRow key={w.id}><TableCell>₹{w.amount}</TableCell><TableCell>{w.method}</TableCell><TableCell><Badge variant={w.status === 'processed' ? 'success' : w.status === 'pending' ? 'secondary' : 'destructive'}>{w.status}</Badge></TableCell><TableCell>{w.createdAt.toDate().toLocaleString()}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </TabsContent>
                <TabsContent value="matches">
                     <Table>
                        <TableHeader><TableRow><TableHead>Prize</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {matches.map(m => <TableRow key={m.id}><TableCell>₹{m.prize}</TableCell><TableCell><Badge variant={m.status === 'completed' ? 'success' : m.status === 'ongoing' ? 'secondary' : 'destructive'}>{m.status}</Badge></TableCell><TableCell>{m.winnerId === userId ? 'Won' : m.status === 'completed' ? 'Lost' : 'N/A'}</TableCell><TableCell>{m.createdAt.toDate().toLocaleString()}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </div>
    );
}
