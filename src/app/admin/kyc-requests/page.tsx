'use client';

import { useState, useEffect } from 'react';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the type for a KYC request
interface KycRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    documentType: 'Aadhaar' | 'PAN';
    documentNumber: string;
    documentFrontUrl: string;
    documentBackUrl?: string; // Optional for PAN
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore timestamp
}

// Main component for the KYC page
export default function KycPage() {
    const [requests, setRequests] = useState<KycRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Real-time listener for KYC requests
    useEffect(() => {
        const q = query(collection(db, "kyc"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const kycRequests: KycRequest[] = [];
            querySnapshot.forEach((doc) => {
                kycRequests.push({ id: doc.id, ...doc.data() } as KycRequest);
            });
            setRequests(kycRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching KYC requests: ", error);
            toast({ title: "Error", description: "Could not fetch KYC requests.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    // Handler to update KYC status
    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        const kycRef = doc(db, "kyc", id);
        try {
            await updateDoc(kycRef, { status });
             // Also update the user's KYC status in the users collection
            const request = requests.find(r => r.id === id);
            if (request && status === 'approved') {
                const userRef = doc(db, "users", request.userId);
                await updateDoc(userRef, { kycVerified: true });
            }
            toast({ title: "Success", description: `KYC request has been ${status}.` });
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({ title: "Error", description: "Failed to update KYC status.", variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading KYC requests...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck /> KYC Verification</CardTitle>
                <CardDescription>Review and manage user KYC submissions. Data is updated in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Document Number</TableHead>
                                <TableHead>Documents</TableHead>
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
                                    <TableCell>{request.documentType}</TableCell>
                                    <TableCell className="font-mono text-xs">{request.documentNumber}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={request.documentFrontUrl} target="_blank" rel="noopener noreferrer">Front</a>
                                            </Button>
                                            {request.documentBackUrl && (
                                                 <Button variant="outline" size="sm" asChild>
                                                    <a href={request.documentBackUrl} target="_blank" rel="noopener noreferrer">Back</a>
                                                </Button>
                                            )}
                                        </div>
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
                                        <p className="font-bold">{request.userName || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">{request.documentType}</p>
                                    </div>
                                </div>
                                <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'success' : 'destructive'}>{request.status}</Badge>
                            </div>
                            <p className="font-mono text-sm bg-muted p-2 rounded my-2">{request.documentNumber}</p>
                            <div className="flex justify-between mt-4 items-center">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={request.documentFrontUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1"/> Front</a>
                                    </Button>
                                    {request.documentBackUrl && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={request.documentBackUrl} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4 mr-1"/> Back</a>
                                        </Button>
                                    )}
                                </div>
                                {request.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(request.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(request.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
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
