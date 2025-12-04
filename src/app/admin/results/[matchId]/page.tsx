
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
import { useFirestore } from "@/firebase/provider";
import { writeBatch, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


export default function VerifyResultPage() {
    const params = useParams();
    const matchId = params.matchId as string;
    const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${matchId}`);
    const [players, setPlayers] = useState<UserProfile[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (match && firestore) {
            const fetchPlayers = async () => {
                setLoadingPlayers(true);
                const playerPromises = match.players.map(playerId => 
                   firestore ? doc(firestore, 'users', playerId) : null
                );
                // This part is tricky without getDocs, so we need to fetch them one by one.
                // In a real app, you might get this data differently.
                setPlayers([]); // For now, we will just use IDs
                setLoadingPlayers(false);
            };
            fetchPlayers();
        }
    }, [match, firestore]);

    const handleDeclareWinner = async () => {
        if (!firestore || !match || !selectedWinner) {
            toast({ variant: 'destructive', title: 'Error', description: 'Missing required data to declare winner.'});
            return;
        }

        setIsSubmitting(true);
        
        const prizePool = (match.entryFee * match.players.length) * 0.9; // 10% commission
        
        const batch = writeBatch(firestore);

        // 1. Update match status to 'completed'
        const matchRef = doc(firestore, 'matches', matchId);
        batch.update(matchRef, { status: 'completed', winnerId: selectedWinner });

        // 2. Create prize transaction for the winner
        const prizeTransactionRef = doc(firestore, `users/${selectedWinner}/transactions`, `prize_${matchId}`);
        batch.set(prizeTransactionRef, {
            userId: selectedWinner,
            type: 'prize',
            amount: prizePool,
            status: 'completed',
            createdAt: new Date().toISOString(),
            relatedId: matchId,
            description: `Prize for match: ${match.title}`
        });

        // 3. A cloud function should atomically handle updating the winner's walletBalance.
        // It would be triggered by the creation of the prize transaction.

        try {
            await batch.commit();
            toast({
                title: "Winner Declared!",
                description: `Prize of ₹${prizePool} will be credited to the winner.`,
            });
            router.push('/admin/results');
        } catch (serverError) {
             console.error(serverError);
             const permissionError = new FirestorePermissionError({
                path: matchRef.path,
                operation: 'update',
                requestResourceData: { status: 'completed' },
             });
             errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (matchLoading) {
        return <div><Skeleton className="h-48 w-full" /></div>
    }

    if (!match) {
        return <Card><CardHeader><CardTitle>Match Not Found</CardTitle></CardHeader></Card>
    }
    
    if (match.status !== 'verification') {
         return <Card>
            <CardHeader>
                <CardTitle>Verification Not Required</CardTitle>
                <CardDescription>This match is not currently awaiting result verification.</CardDescription>
            </CardHeader>
             <CardContent>
                <p>Current status: <Badge>{match.status}</Badge></p>
            </CardContent>
        </Card>
    }

    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold font-headline">Verify Match Result</h1>
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{match.title}</CardTitle>
                        <CardDescription>Match ID: {match.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold">Prize Pool</p>
                            <p className="text-2xl font-bold text-green-600">₹{(match.entryFee * match.players.length) * 0.90}</p>
                            <p className="text-xs text-muted-foreground">Entry: ₹{match.entryFee} x {match.players.length} players (with 10% platform fee)</p>
                        </div>
                         {match.resultScreenshotURL && (
                            <div>
                                <p className="font-semibold mb-2">Result Screenshot</p>
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={match.resultScreenshotURL} alt="Match result screenshot" layout="fill" objectFit="contain" />
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="font-semibold mb-2">Select Winner</p>
                            <RadioGroup onValueChange={setSelectedWinner} value={selectedWinner || undefined}>
                                <div className="space-y-2">
                                {match.players.map(playerId => (
                                    <div key={playerId} className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                        <RadioGroupItem value={playerId} id={playerId} />
                                        <Label htmlFor={playerId} className="font-mono text-sm">{playerId}</Label>
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
                            {isSubmitting ? 'Submitting...' : <> <Trophy className="mr-2 h-4 w-4"/> Declare Winner</>}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
