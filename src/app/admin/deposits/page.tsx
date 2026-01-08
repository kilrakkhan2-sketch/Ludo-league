'use client';

import { useState, useEffect } from 'react';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Define the type for a deposit request
interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    utr: string;
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore timestamp
}

// Main component for the Deposits page
export default function DepositsPage() {
    const [requests, setRequests] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Real-time listener for deposit requests
    useEffect(() => {
        const q = query(collection(db, "deposits"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const depositRequests: DepositRequest[] = [];
            querySnapshot.forEach((doc) => {
                depositRequests.push({ id: doc.id, ...doc.data() } as DepositRequest);
            });
            setRequests(depositRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching deposits: ", error);
            toast({ title: "Error", description: "Could not fetch deposit requests.", variant: "destructive" });
            setLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [toast]);

    // Handler to update deposit status
    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        const depositRef = doc(db, "deposits", id);
        try {
            await updateDoc(depositRef, { status });
            toast({ title: "Success", description: `Deposit has been ${status}.` });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading deposits...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deposit Requests</CardTitle>
                <CardDescription>Review and manage all pending user deposit requests. Data is updated in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>UTR</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Screenshot</TableHead>
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
                                            <span className="font-medium whitespace-nowrap">{request.userName || 'Unknown User'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold whitespace-nowrap">₹{request.amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="font-mono text-xs">{request.utr}</TableCell>
                                    <TableCell className="whitespace-nowrap">{request.createdAt?.toDate().toLocaleString()}</TableCell>
                                     <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                                <Eye className="h-4 w-4 mr-2"/> View
                                            </a>
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'success' : 'destructive'}>{request.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="success" onClick={() => handleUpdateStatus(request.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
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
                                        <p className="font-bold">{request.userName || 'Unknown User'}</p>
                                        <p className="text-sm text-muted-foreground">{request.createdAt?.toDate().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'success' : 'destructive'}>{request.status}</Badge>
                            </div>
                            <div className="mt-2 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Amount:</span> <span className="font-bold">₹{request.amount.toLocaleString('en-IN')}</span></div>
                                <div className="flex justify-between items-center"><span>UTR:</span> <span className="font-mono text-xs bg-muted p-1 rounded">{request.utr}</span></div>
                            </div>
                            <div className="flex justify-between mt-4">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-2"/> View Screenshot</a>
                                </Button>
                                {request.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(request.id, 'approved')}><CheckCircle className="h-4 w-4 mr-1"/> Approve</Button>
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
