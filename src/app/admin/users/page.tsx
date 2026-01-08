'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

// Define the type for a User
interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    balance: number;
    kycVerified: boolean;
    createdAt: any; // Firestore timestamp
}

// Main component for the Users page
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Real-time listener for users
    useEffect(() => {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersList: User[] = [];
            querySnapshot.forEach((doc) => {
                usersList.push({ id: doc.id, ...doc.data() } as User);
            });
            setUsers(usersList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUserClick = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading users...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> All Users</CardTitle>
                <CardDescription>Select a user to view details and manage their account. Data is updated in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>KYC Status</TableHead>
                                <TableHead>Joined On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} onClick={() => handleUserClick(user.id)} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium whitespace-nowrap">{user.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="font-semibold">₹{user.balance?.toLocaleString('en-IN') || 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.kycVerified ? 'success' : 'secondary'}>
                                            {user.kycVerified ? 'Verified' : 'Not Verified'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View: Card List */}
                <div className="grid gap-4 md:hidden">
                    {users.map((user) => (
                        <Card key={user.id} onClick={() => handleUserClick(user.id)} className="p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar>
                                    <AvatarImage src={user.photoURL} />
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{user.displayName}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Balance:</span> <span className="font-bold">₹{user.balance?.toLocaleString('en-IN') || 0}</span></div>
                                <div className="flex justify-between"><span>KYC:</span> 
                                    <Badge variant={user.kycVerified ? 'success' : 'secondary'}>
                                        {user.kycVerified ? 'Verified' : 'Not Verified'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between"><span>Joined:</span> <span className="text-muted-foreground">{user.createdAt?.toDate().toLocaleDateString()}</span></div>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
