
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useUser, useCollection } from '@/firebase';
import { Tournament, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Award, Calendar, Users, ArrowLeft, Info } from 'lucide-react';
import { format } from 'date-fns';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const TournamentDetailsSkeleton = () => (
    <AppShell pageTitle="Loading..." showBackButton>
        <div className="p-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </AppShell>
);

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'upcoming': return 'secondary';
    case 'live': return 'destructive';
    case 'completed': return 'outline';
    default: return 'default';
  }
};


export default function TournamentDetailsPage() {
    const params = useParams();
    if (!params) {
        return <TournamentDetailsSkeleton />;
    }
    const tournamentId = params.id as string;
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isRegistering, setIsRegistering] = useState(false);

    const { data: tournament, loading: tournamentLoading } = useDoc<Tournament>(`tournaments/${tournamentId}`);
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

    const playerIds = tournament?.players?.length ? tournament.players : ['_'];
    const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
        where: ['uid', 'in', playerIds]
    });

    const loading = tournamentLoading || profileLoading || playersLoading;
    const hasRegistered = user ? tournament?.players.includes(user.uid) : false;
    const isFull = tournament ? tournament.players.length >= tournament.maxPlayers : false;

    const handleRegister = async () => {
        if (!user || !firestore || !tournament || !userProfile) {
            toast({ variant: "destructive", title: "Registration failed", description: "You must be logged in to register." });
            return;
        }
        
        if (userProfile.walletBalance < tournament.entryFee) {
             toast({ variant: "destructive", title: "Insufficient Balance", description: "You do not have enough funds to join this tournament." });
             return;
        }

        setIsRegistering(true);
        const tournamentRef = doc(firestore, 'tournaments', tournament.id);
        const userRef = doc(firestore, 'users', user.uid);

        try {
            await runTransaction(firestore, async (transaction) => {
                const tourneyDoc = await transaction.get(tournamentRef);
                const userDoc = await transaction.get(userRef);

                if (!tourneyDoc.exists() || !userDoc.exists()) {
                    throw new Error("Tournament or User not found");
                }
                
                const currentPlayers = tourneyDoc.data().players || [];
                if (currentPlayers.length >= tourneyDoc.data().maxPlayers) {
                    throw new Error("Tournament is already full.");
                }
                
                const currentUserBalance = userDoc.data().walletBalance || 0;
                if (currentUserBalance < tournament.entryFee) {
                    throw new Error("Insufficient funds.");
                }
                
                // Deduct fee and add player
                transaction.update(userRef, { walletBalance: currentUserBalance - tournament.entryFee });
                transaction.update(tournamentRef, { players: arrayUnion(user.uid) });
            });
            
            toast({ title: "Registration successful!", description: `You have been registered for ${tournament.name}.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading || !tournament) {
        return <TournamentDetailsSkeleton />;
    }
    
    return (
        <AppShell pageTitle={tournament.name} showBackButton>
            <div className="space-y-6">
                <div className="relative h-48 w-full">
                    <Image
                        src={tournament.bannerUrl || '/placeholder.jpg'}
                        alt={tournament.name}
                        fill
                        className="object-cover"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                     <div className="absolute bottom-4 left-4 text-primary-foreground">
                        <Badge variant={getStatusVariant(tournament.status)} className="capitalize mb-2">{tournament.status}</Badge>
                        <h1 className="text-2xl font-bold">{tournament.name}</h1>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-muted p-3 rounded-lg"><p className="text-sm font-medium">Prize Pool</p><p className="font-bold text-lg text-primary">₹{tournament.prizePool.toLocaleString()}</p></div>
                    <div className="bg-muted p-3 rounded-lg"><p className="text-sm font-medium">Entry Fee</p><p className="font-bold text-lg">₹{tournament.entryFee}</p></div>
                    <div className="bg-muted p-3 rounded-lg"><p className="text-sm font-medium">Players</p><p className="font-bold text-lg">{tournament.players.length} / {tournament.maxPlayers}</p></div>
                    <div className="bg-muted p-3 rounded-lg"><p className="text-sm font-medium">Start Date</p><p className="font-bold text-lg">{tournament.startDate ? format(tournament.startDate.toDate(), 'd MMM') : 'TBA'}</p></div>
                </div>

                <div className="p-4 space-y-6">
                     {tournament.status === 'upcoming' && (
                         <Card>
                            <CardContent className="p-4">
                                 {hasRegistered ? (
                                    <Button className="w-full" disabled>Registered</Button>
                                ) : (
                                    <Button className="w-full" onClick={handleRegister} disabled={isFull || isRegistering}>
                                        {isRegistering ? 'Registering...' : (isFull ? 'Tournament Full' : `Register for ₹${tournament.entryFee}`)}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader><CardTitle>Description & Rules</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{tournament.description || "No description provided."}</p>
                        </CardContent>
                    </Card>

                    {tournament.prizeDistribution && (
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">Prize Distribution <Info className="h-4 w-4 text-muted-foreground" /></CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-2">
                                {tournament.prizeDistribution.map(tier => (
                                    <div key={tier.rank} className="flex justify-between items-center text-sm p-2 bg-muted rounded-md">
                                        <span className="font-medium">Rank {tier.rank}</span>
                                        <span className="font-bold text-primary">₹{(tournament.prizePool * (tier.percentage / 100)).toLocaleString()}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader><CardTitle>Registered Players ({players.length})</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {players.map(p => <div key={p.id} className="p-2 bg-muted rounded-md font-medium">{p.displayName}</div>)}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppShell>
    );
}
