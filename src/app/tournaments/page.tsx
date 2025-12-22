
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Trophy, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const tournamentImage = PlaceHolderImages.find(p => p.id === 'tournament_card');

const upcomingTournaments = [
    {
        name: "Ludo Summer Championship",
        prize: "1,00,000",
        entry: 500,
        players: 128,
        status: "Upcoming"
    },
    {
        name: "Weekend Bonanza",
        prize: "50,000",
        entry: 250,
        players: 64,
        status: "Live"
    }
]

export default function TournamentsPage() {
    return (
        <AppShell pageTitle="Tournaments" showBackButton>
            <div className="p-4 sm:p-6 space-y-6">
                 {upcomingTournaments.map((tournament, index) => (
                    <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <div className="relative h-40">
                            {tournamentImage && (
                                <Image
                                    src={tournamentImage.imageUrl}
                                    alt={tournamentImage.description}
                                    data-ai-hint={tournamentImage.imageHint}
                                    layout="fill"
                                    objectFit="cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-end p-4">
                                <h3 className="text-2xl font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">{tournament.name}</h3>
                            </div>
                             <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full text-white ${tournament.status === 'Live' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                                {tournament.status}
                            </div>
                        </div>
                        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <Trophy className="mx-auto h-6 w-6 text-yellow-500 mb-1" />
                                <p className="text-sm text-muted-foreground">Prize Pool</p>
                                <p className="font-bold text-lg">₹{tournament.prize}</p>
                            </div>
                             <div>
                                <Users className="mx-auto h-6 w-6 text-primary mb-1" />
                                <p className="text-sm text-muted-foreground">Max Players</p>
                                <p className="font-bold text-lg">{tournament.players}</p>
                            </div>
                             <div>
                                <Shield className="mx-auto h-6 w-6 text-green-500 mb-1" />
                                <p className="text-sm text-muted-foreground">Entry Fee</p>
                                <p className="font-bold text-lg">₹{tournament.entry}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" disabled={tournament.status === 'Upcoming'}>
                                {tournament.status === 'Live' ? 'Join Now' : 'Registration Starts Soon'}
                            </Button>
                        </CardFooter>
                    </Card>
                 ))}
            </div>
        </AppShell>
    );
}

