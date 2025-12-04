
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useCollection, useUser } from "@/firebase";
import type { Match } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const MatchCardSkeleton = () => (
    <Card>
        <CardHeader className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-20" />
        </CardFooter>
    </Card>
);


const MatchCard = ({ match }: { match: Match }) => (
  <Card className="flex flex-col hover:shadow-lg transition-shadow">
    <CardHeader className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{match.title}</CardTitle>
          <CardDescription>
            Entry: <span className="font-bold text-primary">₹{match.entryFee}</span>
          </CardDescription>
        </div>
        <Badge
          variant={
            match.players.length === match.maxPlayers ? "destructive" : (match.status === 'open' ? 'secondary' : 'default')
          }
        >
          {match.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0 flex-grow">
      <div className="flex items-center -space-x-2 mb-2">
        {Array.from({ length: match.players.length }).map((_, i) => (
          <Avatar key={i} className="h-6 w-6 border-2 border-background">
            <AvatarImage
              src={`https://picsum.photos/seed/player${match.id}-${i}/40/40`}
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
       <Button asChild disabled={match.players.length === match.maxPlayers || match.status !== 'open'}>
         <Link href={`/match/${match.id}`}>
            {match.status === 'open' ? 'Join' : 'View'}
         </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function DashboardPage() {
  const { user } = useUser();
  const { data: myMatches, loading: myMatchesLoading } = useCollection<Match>('matches', {
    where: user?.uid ? ['players', 'array-contains', user.uid] : undefined,
  });
  const { data: openMatches, loading: openMatchesLoading, hasMore: hasMoreOpen, loadMore: loadMoreOpen } = useCollection<Match>('matches', {
    where: ['status', '==', 'open'],
    orderBy: ['createdAt', 'desc'],
    limit: 6
  });
  const { data: fullMatches, loading: fullMatchesLoading, hasMore: hasMoreFull, loadMore: loadMoreFull } = useCollection<Match>('matches', {
      where: ['status', 'in', ['ongoing', 'completed', 'verification']],
      orderBy: ['createdAt', 'desc'],
      limit: 3
  })

  const Skeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
    </div>
  )


  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Find a Match</h1>
            <p className="text-muted-foreground">
              Join an existing match or create your own.
            </p>
          </div>
          <Button asChild>
            <Link href="/create-match">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create a Match
            </Link>
          </Button>
        </div>

        {/* My Matches Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold font-headline">My Matches</h2>
            <p className="text-muted-foreground">
              Your active games. You can have a maximum of 3 active matches.
            </p>
          </div>
          {myMatchesLoading ? <Skeletons /> : myMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                You haven&apos;t joined or created any matches yet.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Open Matches Section */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {openMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                ))}
                </div>
                {hasMoreOpen && (
                    <div className="flex justify-center">
                        <Button onClick={loadMoreOpen} disabled={openMatchesLoading}>
                            {openMatchesLoading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
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

        {/* Full Matches Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold font-headline">Ongoing & Recent Matches</h2>
            <p className="text-muted-foreground">
              Matches that are already in progress or just finished.
            </p>
          </div>
          {fullMatchesLoading && fullMatches.length === 0 ? <Skeletons /> : fullMatches.length > 0 ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-80">
                {fullMatches.map((match) => (
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
