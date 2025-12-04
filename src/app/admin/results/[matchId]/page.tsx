
'use client';

import { useDoc } from "@/firebase";
import type { Match, UserProfile } from "@/types";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useFirebase } from "@/firebase/provider";
import { writeBatch, doc, getDocs, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle } from "lucide-react";

export default function VerifyResultPage() {
    const params = useParams();
    const matchId = params.matchId as string;
    const { data: match, loading: matchLoading, error } = useDoc<Match>(`matches/${matchId}`);
    const [players, setPlayers] = useState<UserProfile[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (match && firestore) {
            const fetchPlayers = async () => {
                setLoadingPlayers(true);
                try {
                    const q = query(collection(firestore, 'users'), where('uid', 'in', match.players));
                    const querySnapshot = await getDocs(q);
                    const playersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
                    setPlayers(playersData);
                } catch (error) {
                    console.error("Error fetching players:", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch player details.' });
                }
                setLoadingPlayers(false);
            };
            fetchPlayers();
        }
    }, [match, firestore, toast]);

    const handleDeclareWinner = async () => {
        if (!firestore || !match || !selectedWinner) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a winner.' });
            return;
        }

        setIsSubmitting(true);
        const batch = writeBatch(firestore);

        const matchRef = doc(firestore, 'matches', matchId);
        batch.update(matchRef, { status: 'completed', winnerId: selectedWinner });

        const winnerRef = doc(firestore, 'users', selectedWinner);
        // We should fetch the winner's current balance to update it.
        // For simplicity here, we're creating a transaction record, 
        // and a cloud function should handle the balance update atomically.

        const prizeTransactionRef = doc(collection(firestore, `users/${selectedWinner}/transactions`));
        batch.set(prizeTransactionRef, {
            amount: match.prizePool || 0,
            type: 'prize',
            description: `Prize for match: ${match.title}`,
            matchId: matchId,
            createdAt: new Date(),
        });

        try {
            await batch.commit();
            toast({
                title: "Winner Declared!",
                description: `Prize of ₹${match.prizePool} will be credited to the winner.`,
            });
            router.push('/admin/matches');
        } catch (serverError) {
            console.error("Error declaring winner:", serverError);
            toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not declare the winner.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (matchLoading || loadingPlayers) {
        return <div className="space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>;
    }

    if (!match) {
        return <Card><CardHeader><CardTitle>Match Not Found</CardTitle></CardHeader></Card>;
    }

    if (match.status !== 'verification') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="text-yellow-500" /> Verification Not Required</CardTitle>
                    <CardDescription>This match is not currently awaiting result verification.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Current status: <Badge variant="default">{match.status}</Badge></p>
                    {match.winnerId && <p>Winner: {players.find(p => p.id === match.winnerId)?.displayName || 'N/A'}</p>}
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => router.push('/admin/matches')}>Back to Matches</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Verify Match Result</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {match.results?.map((result, index) => {
                        const player = players.find(p => p.id === result.userId);
                        return (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle>Result from: {player?.displayName || 'Unknown Player'}</CardTitle>
                                    <CardDescription>User ID: {result.userId}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Image src={result.screenshotUrl} alt={`Result screenshot from ${player?.displayName}`} width={1920} height={1080} className="rounded-md border" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card className="lg:col-span-1 self-start">
                    <CardHeader>
                        <CardTitle>{match.title}</CardTitle>
                        <CardDescription>Match ID: {matchId}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold">Prize Pool</p>
                            <p className="text-2xl font-bold text-green-600">₹{match.prizePool?.toLocaleString() || '0'}</p>
                            <p className="text-xs text-muted-foreground">Entry: ₹{match.entryFee} x {match.players.length} players</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-2">Select Winner</p>
                            <RadioGroup onValueChange={setSelectedWinner} value={selectedWinner || undefined}>
                                <div className="space-y-2">
                                    {players.map(player => (
                                        <div key={player.id} className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                            <RadioGroupItem value={player.id} id={player.id} />
                                            <Label htmlFor={player.id} className="font-medium">{player.displayName}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            disabled={!selectedWinner || isSubmitting}
                            onClick={handleDeclareWinner}
                        >
                            {isSubmitting ? 'Declaring...' : <><Trophy className="mr-2 h-4 w-4" /> Declare Winner</>}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
