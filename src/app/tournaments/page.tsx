
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, Users, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useCollection, useUser, useDoc } from "@/firebase";
import { useFirebase } from "@/firebase/provider";
import type { Tournament, UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useState } from "react";

const tournamentCardImage = PlaceHolderImages.find(
  (p) => p.id === "tournament_card"
);

const TournamentCardSkeleton = () => (
    <Card className="overflow-hidden">
        <Skeleton className="h-40 w-full" />
        <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isRegistering, setIsRegistering] = useState(false);

    const hasRegistered = user ? tournament.players.includes(user.uid) : false;
    const isFull = tournament.players.length >= tournament.maxPlayers;
    
    const handleRegister = async () => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in to register." });
            return;
        }
        setIsRegistering(true);
        try {
            const tournamentRef = doc(firestore, 'tournaments', tournament.id);
            await updateDoc(tournamentRef, {
                players: arrayUnion(user.uid)
            });
            toast({ title: "Registration successful!", description: `You have been registered for ${tournament.name}.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
        } finally {
            setIsRegistering(false);
        }
    };
    
    const getButton = () => {
        if (hasRegistered) {
            return <Button className="w-full" disabled>Registered</Button>;
        }
        switch(tournament.status) {
            case 'upcoming':
                return <Button className="w-full" onClick={handleRegister} disabled={isFull || isRegistering}>{isRegistering ? 'Registering...' : (isFull ? 'Full' : 'Register Now')}</Button>
            case 'live':
                return <Link href={`/tournament/${tournament.id}/live`} className="w-full"><Button className="w-full" variant="destructive">View Live</Button></Link>
            case 'completed':
                return <Link href={`/tournament/${tournament.id}/results`} className="w-full"><Button className="w-full" variant="outline">View Results</Button></Link>
            default:
                return null;
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-card">
            <div className="relative h-40 w-full">
                <Image
                src={tournament.bannerUrl || tournamentCardImage?.imageUrl || ''}
                alt={tournament.name}
                data-ai-hint="tournament banner"
                fill
                className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge
                className="absolute top-3 right-3 capitalize"
                variant={
                    tournament.status === "live" ? "default" : "secondary"
                }
                >
                {tournament.status}
                </Badge>
                <div className="absolute bottom-3 left-4 text-primary-foreground">
                    <h3 className="font-bold text-lg">{tournament.name}</h3>
                    <p className="text-xs opacity-80">Entry: ₹{tournament.entryFee}</p>
                </div>
            </div>
            <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">
                    ₹{tournament.prizePool.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold text-foreground">
                    {tournament.players.length}/{tournament.maxPlayers}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-5 w-5" />
                <span>Starts: {tournament.startDate ? format(tournament.startDate.toDate(), 'PP') : 'N/A'}</span>
            </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                {getButton()}
            </CardFooter>
        </Card>
    );
};

export default function TournamentsPage() {
  const { user } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);
  const { data: tournaments, loading } = useCollection<Tournament>('tournaments', {
      orderBy: ['startDate', 'desc']
  });

  const canCreate = profile && (profile.role === 'superadmin' || profile.role === 'match_admin');

  return (
    <AppShell pageTitle="Tournaments">
      <div className="p-4 space-y-6">
        {canCreate && (
             <div className="flex justify-end">
                <Link href="/admin/tournaments/create">
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Create Tournament</Button>
                </Link>
            </div>
        )}
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
            </div>
        ) : tournaments.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Tournaments Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                {canCreate ? "Create the first tournament and engage your players!" : "There are no active or upcoming tournaments right now."}
                </p>
                {canCreate && (
                    <div className="mt-6">
                        <Link href="/admin/tournaments/create">
                            <Button><PlusCircle className="mr-2 h-4 w-4" />Create a Tournament</Button>
                        </Link>
                    </div>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
        )}
      </div>
    </AppShell>
  );
}
