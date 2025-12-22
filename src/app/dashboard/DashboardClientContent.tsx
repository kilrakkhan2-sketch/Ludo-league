
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Match, UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageCircle, PlusCircle, Swords } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy } from "lucide-react";
import { useMemo } from "react";

const MatchCard = ({ match }: { match: Match }) => {
    const isFull = match.players.length >= match.maxPlayers;

    const getStatusVariant = (status: Match['status']) => {
        switch (status) {
            case 'open': return isFull ? 'destructive' : 'secondary';
            case 'ongoing': return 'default';
            case 'completed': return 'outline';
            case 'disputed': return 'destructive';
            case 'processing': return 'default';
            default: return 'default';
        }
    }

    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow shrink-0 w-72">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg truncate">{match.title}</CardTitle>
              <CardDescription>
                Entry: <span className="font-bold text-primary">₹{match.entryFee}</span>
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(match.status)}
              className="capitalize"
            >
              {isFull && match.status === 'open' ? 'Full' : match.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="flex items-center -space-x-2 mb-2">
            {match.players.map((playerId, i) => (
              <Avatar key={playerId} className="h-6 w-6 border-2 border-background">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${playerId}`}
                />
                <AvatarFallback>P{i + 1}</AvatarFallback>
              </Avatar>
            ))}
             {Array.from({ length: Math.max(0, match.maxPlayers - match.players.length) }).map((_, i) => (
                <Avatar key={`empty-${i}`} className="h-6 w-6 border-2 border-background bg-muted">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
            ))}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>
              {match.players.length} / {match.maxPlayers} Players
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <p className="text-lg font-bold">₹{match.prizePool}</p>
          </div>
           <Button asChild>
             <Link href={`/match/${match.id}`}>
                View
             </Link>
          </Button>
        </CardFooter>
      </Card>
    );
}

export default function DashboardClientContent() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);

    const { data: openMatches, loading: openMatchesLoading } = useCollection<Match>('matches', {
        where: ['status', '==', 'open'],
        orderBy: ['createdAt', 'desc'],
        limit: 20
    });
    
    const loading = userLoading || profileLoading;

    return (
        <div className="bg-muted/30">
            <div className="bg-primary text-primary-foreground p-4 sm:p-6">
                <header className="flex justify-between items-center mb-4">
                    {loading ? <Skeleton className="h-7 w-32 bg-white/20"/> : <h1 className="text-xl sm:text-2xl font-bold">Hi, {profile?.displayName || 'Player'}!</h1>}
                    <div className="flex items-center gap-4">
                        <MessageCircle className="h-6 w-6" />
                        <Bell className="h-6 w-6" />
                    </div>
                </header>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-sm opacity-80">Wallet Balance</p>
                            {loading ? <Skeleton className="h-8 w-36 mt-1 bg-white/20"/> : <p className="text-3xl font-bold">₹{profile?.walletBalance?.toLocaleString() || '0.00'}</p>}
                        </div>
                         <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md flex-1" asChild>
                                <Link href="/add-money">
                                    Add Money
                                </Link>
                            </Button>
                             <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md flex-1" asChild>
                                <Link href="/create-match">
                                    Create Match
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold">Open Matches</h2>
                        <Link href="/matches/open" className="text-sm font-semibold text-primary">View All</Link>
                    </div>
                    {openMatchesLoading ? (
                        <div className="flex space-x-4 overflow-x-auto pb-4">
                            <Skeleton className="shrink-0 w-72 h-52 rounded-lg" />
                            <Skeleton className="shrink-0 w-72 h-52 rounded-lg" />
                        </div>
                    ): openMatches.length > 0 ? (
                        <div className="overflow-x-auto">
                            <div className="flex space-x-4 pb-4">
                            {openMatches.map(match => <MatchCard key={match.id} match={match}/>)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-card">
                            <p className="text-muted-foreground mb-2">No open matches available right now.</p>
                            <Button asChild>
                              <Link href="/create-match">Create the first match!</Link>
                            </Button>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
