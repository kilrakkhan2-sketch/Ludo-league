
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Match, UserProfile, Announcement } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageCircle, PlusCircle, Swords, Rss } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const StatCard = ({ title, value, loading }: { title: string, value: string | number, loading: boolean }) => (
    <div className="bg-card p-3 rounded-lg shadow-sm text-center">
        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
            </div>
        ) : (
            <>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-lg font-bold">{value}</p>
            </>
        )}
    </div>
);


const MatchCard = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const hasJoined = user ? match.players.includes(user.uid) : false;
    const isFull = match.players.length >= match.maxPlayers;

    const getStatusVariant = (status: Match['status']) => {
        switch (status) {
            case 'open': return isFull ? 'destructive' : 'secondary';
            case 'ongoing': return 'default';
            case 'completed': return 'outline';
            case 'verification': return 'destructive';
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
            >
              {isFull && match.status === 'open' ? 'Full' : match.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="flex items-center -space-x-2 mb-2">
            {Array.from({ length: match.players.length }).map((_, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=player${match.id}-${i}`}
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
            <p className="text-lg font-bold">₹{match.prizePool || match.entryFee * match.players.length * 0.9}</p>
          </div>
           <Button asChild disabled={isFull && !hasJoined}>
             <Link href={`/match/${match.id}`}>
                {hasJoined ? 'View' : 'Join'}
             </Link>
          </Button>
        </CardFooter>
      </Card>
    );
}

const NewsCarousel = () => {
    const { data: announcements, loading } = useCollection<Announcement>('announcements', { orderBy: ['createdAt', 'desc'], limit: 5 });

    if (loading) {
        return (
            <section>
                <h2 className="text-lg font-bold mb-3">News & Updates</h2>
                <Skeleton className="w-full h-32 rounded-lg" />
            </section>
        );
    }
    
    if (announcements.length === 0) {
        return null; // Don't render the section if there are no announcements
    }

    const getBadgeVariant = (type: Announcement['type']) => {
        switch (type) {
            case 'Promo': return 'default';
            case 'Update': return 'secondary';
            case 'Warning': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <section>
             <h2 className="text-lg font-bold mb-3">News & Updates</h2>
             <Carousel
                opts={{
                    align: "start",
                    loop: announcements.length > 1,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {announcements.map((ann) => (
                        <CarouselItem key={ann.id}>
                            <Card className="bg-card">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{ann.title}</CardTitle>
                                        <Badge variant={getBadgeVariant(ann.type)}>{ann.type}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{ann.content}</p>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {announcements.length > 1 && (
                    <>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </>
                )}
            </Carousel>
        </section>
    );
};

const MatchSection = ({ title, matches, loading, emptyMessage, viewAllLink }: { title: string, matches: Match[], loading: boolean, emptyMessage: string, viewAllLink?: string }) => (
    <section>
        <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {viewAllLink && <Link href={viewAllLink} className="text-sm font-semibold text-primary">View All</Link>}
        </div>
        {loading ? (
             <div className="flex space-x-4 overflow-x-auto pb-4">
                <Skeleton className="shrink-0 w-72 h-48 rounded-lg" />
                <Skeleton className="shrink-0 w-72 h-48 rounded-lg" />
             </div>
        ): matches.length > 0 ? (
            <div className="overflow-x-auto">
                <div className="flex space-x-4 pb-4">
                   {matches.map(match => <MatchCard key={match.id} match={match}/>)}
                </div>
            </div>
        ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-card">
                <p className="text-muted-foreground mb-2">{emptyMessage}</p>
                <Button asChild>
                    <Link href="/create-match"><PlusCircle className="mr-2 h-4 w-4"/>Create a Match</Link>
                </Button>
            </div>
        )}
    </section>
);


export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
    
    const { data: myMatches, loading: myMatchesLoading } = useCollection<Match>('matches', {
        where: user?.uid ? [['players', 'array-contains', user.uid], ['status', '!=', 'completed']] : undefined,
        limit: 10,
    });

    const { data: openMatchesData, loading: openMatchesLoading } = useCollection<Match>('matches', {
        where: [['status', '==', 'open'], ['privacy', '==', 'public']],
        limit: 10,
    });

    const openMatches = useMemo(() => {
        if (!openMatchesData) return [];
        return [...openMatchesData].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }, [openMatchesData]);
    
    const loading = userLoading || profileLoading;
    
    const matchesPlayed = profile?.matchesPlayed || 0;
    const matchesWon = profile?.matchesWon || 0;
    const winRate = matchesPlayed > 0 ? `${((matchesWon / matchesPlayed) * 100).toFixed(0)}%` : "0%";

    return (
        <AppShell pageTitle="Dashboard">
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
                            <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md w-full sm:w-auto" asChild>
                                <Link href="/add-money">
                                    Add Money
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-20">
                    <NewsCarousel />

                    <section>
                        <h2 className="text-lg font-bold mb-3">Quick Stats</h2>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <StatCard title="Total Matches" value={matchesPlayed} loading={loading}/>
                            <StatCard title="Wins" value={matchesWon} loading={loading} />
                            <StatCard title="Win Rate" value={winRate} loading={loading} />
                        </div>
                    </section>
                    
                     <MatchSection
                        title="My Active Matches"
                        matches={myMatches || []}
                        loading={myMatchesLoading}
                        emptyMessage="You have no active matches."
                        viewAllLink="/matches/my-matches"
                    />

                    <MatchSection
                        title="Open Matches"
                        matches={openMatches}
                        loading={openMatchesLoading}
                        emptyMessage="No open matches available."
                        viewAllLink="/matches/open"
                    />

                </div>
            </div>
        </AppShell>
    );
}
