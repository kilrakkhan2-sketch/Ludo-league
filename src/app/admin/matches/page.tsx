'use client';

import { useState, useEffect } from 'react';
import { db } from "@/firebase";// Assuming you have firebase initialized and exported from here
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Swords, Crown } from "lucide-react";

// Define the type for a Match
interface Match {
    id: string;
    players: {
        uid: string;
        displayName: string;
        photoURL: string;
    }[];
    winnerId?: string;
    prize: number;
    status: 'ongoing' | 'completed' | 'cancelled';
    createdAt: any; // Firestore timestamp
}

// Main component for the Matches page
export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener for matches
    useEffect(() => {
        const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const matchesList: Match[] = [];
            querySnapshot.forEach((doc) => {
                matchesList.push({ id: doc.id, ...doc.data() } as Match);
            });
            setMatches(matchesList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching matches: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading matches...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords /> Match History</CardTitle>
                <CardDescription>Browse the history of all matches played. Data is updated in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Players</TableHead>
                                <TableHead>Prize</TableHead>
                                <TableHead>Winner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell className="flex items-center gap-4">
                                        {match.players.map(p => (
                                            <div key={p.uid} className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.photoURL} />
                                                    <AvatarFallback>{p.displayName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{p.displayName}</span>
                                            </div>
                                        ))}
                                    </TableCell>
                                    <TableCell className="font-semibold">₹{match.prize.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        {match.winnerId ? 
                                            match.players.find(p => p.uid === match.winnerId)?.displayName : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={match.status === 'completed' ? 'success' : match.status === 'ongoing' ? 'secondary' : 'destructive'}>{match.status}</Badge>
                                    </TableCell>
                                    <TableCell>{match.createdAt?.toDate().toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View: Card List */}
                <div className="grid gap-4 md:hidden">
                    {matches.map((match) => (
                        <Card key={match.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-lg">Prize: ₹{match.prize.toLocaleString('en-IN')}</p>
                                <Badge variant={match.status === 'completed' ? 'success' : match.status === 'ongoing' ? 'secondary' : 'destructive'}>{match.status}</Badge>
                            </div>
                             <p className="text-sm text-muted-foreground mb-3">{match.createdAt?.toDate().toLocaleString()}</p>
                            
                            <div className="space-y-3">
                                {match.players.map(p => (
                                     <div key={p.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={p.photoURL} />
                                                <AvatarFallback>{p.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{p.displayName}</span>
                                        </div>
                                        {match.winnerId === p.uid && <Crown className="h-5 w-5 text-yellow-500"/>}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
