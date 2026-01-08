'use client';

import { useState, useEffect } from 'react';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the type for a withdrawal request
interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    method: 'UPI' | 'Bank Transfer';
    details: string; // UPI ID or Bank Account details
    status: 'pending' | 'processed' | 'rejected';
    createdAt: any; // Firestore timestamp
}

// Main component for the Withdrawals page
export default function WithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Real-time listener for withdrawal requests
    useEffect(() => {
        const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const withdrawalRequests: WithdrawalRequest[] = [];
            querySnapshot.forEach((doc) => {
                withdrawalRequests.push({ id: doc.id, ...doc.data() } as WithdrawalRequest);
            });
            setRequests(withdrawalRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching withdrawals: ", error);
            toast({ title: "Error", description: "Could not fetch withdrawal requests.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    // Handler to update withdrawal status
    const handleUpdateStatus = async (id: string, status: 'processed' | 'rejected') => {
        const withdrawalRef = doc(db, "withdrawals", id);
        try {
            await updateDoc(withdrawalRef, { status });
            toast({ title: "Success", description: `Withdrawal has been ${status}.` });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading withdrawal requests...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Withdrawal Requests</CardTitle>
                <CardDescription>Review and process user withdrawal requests. Data is updated in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={request.userAvatar} />
                                                <AvatarFallback>{request.userName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium whitespace-nowrap">{request.userName || 'Unknown'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">₹{request.amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>{request.method}</TableCell>
                                    <TableCell className="font-mono text-xs">{request.details}</TableCell>
                                    <TableCell>{request.createdAt?.toDate().toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'processed' ? 'success' : 'destructive'}>{request.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="success" onClick={() => handleUpdateStatus(request.id, 'processed')}><CheckCircle className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(request.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View: Card List */}
                <div className="grid gap-4 md:hidden">
                    {requests.map((request) => (
                        <Card key={request.id} className="p-4">
                            <div className="flex items-start justify-between">
                               <div className="flex items-center gap-3 mb-3">
                                    <Avatar>
                                        <AvatarImage src={request.userAvatar} />
                                        <AvatarFallback>{request.userName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{request.userName || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">{request.createdAt?.toDate().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'processed' ? 'success' : 'destructive'}>{request.status}</Badge>
                            </div>
                             <div className="mt-2 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Amount:</span> <span className="font-bold">₹{request.amount.toLocaleString('en-IN')}</span></div>
                                <div className="flex justify-between items-center"><span>Method:</span> <span className="font-semibold">{request.method}</span></div>
                                <div className="w-full">
                                    <p>Details:</p>
                                    <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-words">{request.details}</p>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                {request.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(request.id, 'processed')}><CheckCircle className="h-4 w-4 mr-1"/> Process</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(request.id, 'rejected')}><XCircle className="h-4 w-4 mr-1"/> Reject</Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
