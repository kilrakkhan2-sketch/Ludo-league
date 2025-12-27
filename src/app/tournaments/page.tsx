
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Trophy, Users, Award, Ticket, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection } from '@/firebase';
import type { Tournament } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center text-center bg-card/70 p-3 rounded-lg">
        {icon}
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        <p className="font-bold text-sm">{value}</p>
    </div>
);


const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const isLive = tournament.status === 'live';
    const isUpcoming = tournament.status === 'upcoming';
    const isCompleted = tournament.status === 'completed';
    const isFull = tournament.players?.length >= tournament.maxPlayers;
    const startsIn = tournament.startDate ? formatDistanceToNowStrict(new Date(tournament.startDate.seconds * 1000)) : 'N/A';

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl lg:text-2xl">{tournament.name}</CardTitle>
                    <div className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full text-white whitespace-nowrap",
                        isLive && "bg-red-500/80 animate-pulse",
                        isUpcoming && "bg-blue-500/80",
                        isCompleted && "bg-gray-600/80"
                    )}>
                        {tournament.status}
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <Award className="w-6 h-6 text-amber-400" />
                    <span className="text-2xl lg:text-3xl font-bold text-amber-400 font-headline tracking-tighter">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tournament.prizePool)}
                    </span>
                    <span className="text-sm text-muted-foreground">in prizes</span>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 flex-grow">
                <StatItem icon={<Ticket className="w-5 h-5 text-green-400" />} label="Entry Fee" value={`₹${tournament.entryFee}`} />
                <StatItem icon={<Users className="w-5 h-5 text-cyan-400" />} label="Players" value={`${tournament.players?.length || 0}/${tournament.maxPlayers}`} />
                {isUpcoming && <StatItem icon={<Clock className="w-5 h-5 text-blue-400" />} label="Starts In" value={startsIn} />}
                {isCompleted && <StatItem icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="Winner" value={"TBD"} />}
                 {isLive && <StatItem icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="Live Now" value={""} />}
            </CardContent>
            <CardFooter>
                <Button className="w-full font-bold text-lg" disabled={isCompleted || (isUpcoming && isFull)}>
                    {isLive && "Join Now"}
                    {isUpcoming && !isFull && "Register Now"}
                    {isUpcoming && isFull && "Registration Full"}
                    {isCompleted && "View Results"}
                </Button>
            </CardFooter>
        </Card>
    );
}

const TournamentCardSkeleton = () => (
    <Card>
        <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></CardContent>
        <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
    </Card>
)

export default function TournamentsPage() {
    const [tab, setTab] = useState<Tournament['status']>("live");
    const { data: allTournaments, loading } = useCollection<Tournament>('tournaments', { orderBy: ['startDate', 'desc'] });

    const filteredTournaments = (allTournaments || []).filter(t => t.status === tab);

    return (
        <div className="container py-12 md:py-16">
            <div className="text-center mb-10 md:mb-14">
                 <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">Official Tournaments</h1>
                <p className="max-w-xl mx-auto mt-3 text-muted-foreground">Compete for glory and huge prize pools. Are you ready to become a legend?</p>
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as Tournament['status'])} className="w-full max-w-4xl mx-auto mb-8">
                <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-sm">
                    <TabsTrigger value="live">Live</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                 {loading ? (
                    <>
                        <TournamentCardSkeleton />
                        <TournamentCardSkeleton />
                        <TournamentCardSkeleton />
                    </>
                 ) : filteredTournaments.length > 0 ? (
                    filteredTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)
                 ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-card/30 rounded-lg">
                        <p className="text-lg text-muted-foreground">No {tab} tournaments at the moment.</p>
                        <p className="text-sm text-muted-foreground">Check back soon!</p>
                    </div>
                 )}
            </div>
        </div>
    );
}
