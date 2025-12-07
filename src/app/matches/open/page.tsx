
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
import { Users, Trophy } from "lucide-react";
import Link from "next/link";
import { useCollection, useUser } from "@/firebase";
import type { Match } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const MatchCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-20" />
        </CardFooter>
    </Card>
);

const MatchCard = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const hasJoined = user ? match.players.includes(user.uid) : false;

    return (
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
                match.players.length === match.maxPlayers ? "destructive" : "secondary"
              }
            >
              {match.players.length === match.maxPlayers ? 'Full' : 'Open'}
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
           <Button asChild disabled={match.players.length === match.maxPlayers || hasJoined}>
             <Link href={`/match/${match.id}`}>
                {hasJoined ? 'View' : 'Join'}
             </Link>
          </Button>
        </CardFooter>
      </Card>
    );
}

export default function OpenMatchesPage() {
  const { data: matches, loading, hasMore, loadMore } = useCollection<Match>("matches", {
    where: ["status", "==", "open"],
    orderBy: ["createdAt", "desc"],
    limit: 12,
  });

  const Skeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MatchCardSkeleton />
      <MatchCardSkeleton />
      <MatchCardSkeleton />
      <MatchCardSkeleton />
    </div>
  );

  return (
    <AppShell pageTitle="Open Matches">
      <div className="p-4 space-y-6">
        {loading && matches.length === 0 ? (
          <Skeletons />
        ) : matches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match: Match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={loadMore} disabled={loading} variant="outline">
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No open matches</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No open matches available right now. Why not create one?
            </p>
             <Button className="mt-4" asChild>
                <Link href="/create-match">Create a Match</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
