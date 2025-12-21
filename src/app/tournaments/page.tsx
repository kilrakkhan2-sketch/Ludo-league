
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
import { useCollection, useUser } from "@/firebase";
import { useFirebase } from "@/firebase/provider";
import type { Tournament } from "@/types";
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
                return <Button className="w-full" variant="destructive">View Live</Button>
            case 'completed':
                return <Button className="w-full" variant="outline" disabled>View Results</Button>
            default:
                return null;
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-card">
            {tournamentCardImage && (
            <div className="relative h-40 w-full">
                <Image
                src={`${tournamentCardImage.imageUrl.replace('&w=1080', '&w=600')}`}
                alt={tournamentCardImage.description}
                data-ai-hint={tournamentCardImage.imageHint}
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
            )}
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
  const { data: tournaments, loading } = useCollection<Tournament>('tournaments', {
      orderBy: ['startDate', 'desc']
  });

  return (
    <AppShell pageTitle="Tournaments">
      <div className="p-4 space-y-6">
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
                There are no active or upcoming tournaments right now.
                </p>
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
