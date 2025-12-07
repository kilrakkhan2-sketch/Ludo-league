
'use client';

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
import { Users, Trophy, PlusCircle, Wallet, Calendar, Bot } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Match, UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

const MatchCardSkeleton = () => (
    <Card className="flex flex-col border-border/60 hover:border-primary/50 transition-colors duration-300">
        <CardHeader className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-5 w-1/2" />
        </CardContent>
        <CardFooter className="p-4 pt-0">
             <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);


const MatchCard = ({ match, myMatchesCount }: { match: Match, myMatchesCount?: number }) => (
  <Card className="flex flex-col border-border/60 hover:border-primary/50 transition-colors duration-300 bg-card/50">
    <CardHeader className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent"/>
            <CardTitle className="text-md font-headline">LEAGUE MATCH #{match.id.substring(0, 6).toUpperCase()}</CardTitle>
        </div>
    </CardHeader>
    <CardContent className="p-4 flex-grow space-y-3">
       <div>
            <p className="text-xs text-muted-foreground font-semibold">DIVISION</p>
            <p className="font-headline text-lg text-primary">{match.title}</p>
       </div>
       <div>
            <p className="text-xs text-muted-foreground font-semibold">PRIZE POOL</p>
            <p className="font-code text-xl font-bold text-success">₹{match.prizePool || match.entryFee * match.players.length * 0.9}</p>
       </div>
       <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-code">{match.players.length}/{match.maxPlayers} SLOTS</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-code">{formatDistanceToNow(new Date(match.createdAt.seconds * 1000), { addSuffix: true })}</span>
            </div>
       </div>
    </CardContent>
    <CardFooter className="p-2 bg-muted/50 border-t border-border/60">
       <Button asChild className="w-full" disabled={match.players.length === match.maxPlayers || match.status !== 'open' || (myMatchesCount !== undefined && myMatchesCount >= 3)}>
         <Link href={`/match/${match.id}`}>
            JOIN LEAGUE
         </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function DashboardPage() {
  const { user } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { data: myMatches, loading: myMatchesLoading } = useCollection<Match>('matches', {
    where: user?.uid ? ['players', 'array-contains', user.uid] : undefined,
    limit: 3
  });
  
  const { data: allOpenMatches, loading: openMatchesLoading } = useCollection<Match>('matches', {
    where: ['status', '==', 'open'],
    orderBy: ['createdAt', 'desc'],
    limit: 6
  });

  const openMatches = useMemo(() => {
    if (!user) return allOpenMatches;
    return allOpenMatches.filter(match => !match.players.includes(user.uid));
  }, [allOpenMatches, user]);


  const { data: fullMatches, loading: fullMatchesLoading, hasMore: hasMoreFull, loadMore: loadMoreFull } = useCollection<Match>('matches', {
      where: ['status', 'in', ['ongoing', 'completed', 'verification']],
      orderBy: ['createdAt', 'desc'],
      limit: 3
  })

  const Skeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
    </div>
  )


  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Find a Match</h1>
            <p className="text-muted-foreground">
              Join an existing match or create your own.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {profileLoading ? (
                <Skeleton className="h-10 w-24" />
            ) : (
                <Button variant="outline" asChild>
                    <Link href="/wallet">
                        <Wallet className="h-4 w-4 mr-2" />
                        <span className="font-code">₹{profile?.walletBalance || 0}</span>
                    </Link>
                </Button>
            )}
            <Button asChild className="font-headline">
                <Link href="/create-match">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create a Match
                </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-headline">My Matches</h2>
                    <p className="text-muted-foreground">
                    Your active games. You can have a maximum of 3 active matches.
                    </p>
                </div>
                <Button variant="link" asChild><Link href="/matches/my-matches">View All</Link></Button>
            </div>
          {myMatchesLoading ? <Skeletons /> : myMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myMatches.map((match: Match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                You haven't joined or created any matches yet.
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold font-headline">Open Matches</h2>
                <p className="text-muted-foreground">
                Available matches you can join right now.
                </p>
            </div>
             <Button variant="link" asChild><Link href="/matches/open">View All</Link></Button>
          </div>
          {openMatchesLoading && openMatches.length === 0 ? <Skeletons /> : openMatches.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {openMatches.map((match: Match) => (
                    <MatchCard key={match.id} match={match} myMatchesCount={myMatches.length} />
                ))}
                </div>
            </>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No open matches available. Why not create one?
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold font-headline">Ongoing & Recent Matches</h2>
            <p className="text-muted-foreground">
              Matches that are already in progress or just finished.
            </p>
          </div>
          {fullMatchesLoading && fullMatches.length === 0 ? <Skeletons /> : fullMatches.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
                {fullMatches.map((match: Match) => (
                    <MatchCard key={match.id} match={match} />
                ))}
                </div>
                {hasMoreFull && (
                     <div className="flex justify-center">
                        <Button onClick={loadMoreFull} disabled={fullMatchesLoading} variant="secondary">
                            {fullMatchesLoading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No ongoing or recent matches right now.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
