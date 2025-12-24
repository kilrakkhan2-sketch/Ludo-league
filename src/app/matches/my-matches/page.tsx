'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, PlusCircle, Gamepad2, CheckCircle, Hourglass, XCircle, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser } from '@/firebase';
import type { Match } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalance } from '@/components/wallet-balance';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatarList } from '@/components/matches/PlayerAvatarList';

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
  const isFull = match.players.length >= match.maxPlayers;

  const getStatusVariant = (status: Match['status']) => {
    switch (status) {
      case 'open':
        return isFull ? 'destructive' : 'secondary';
      case 'ongoing':
      case 'processing':
        return 'default';
      case 'completed':
        return 'outline';
      case 'disputed':
      case 'verification':
        return 'destructive';
      case 'cancelled':
        return 'destructive'
      default:
        return 'default';
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg truncate">{match.title}</CardTitle>
            <CardDescription>
              Entry: <span className="font-bold text-primary">₹{match.entryFee}</span>
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(match.status)} className="capitalize">
            {isFull && match.status === 'open' ? 'Full' : match.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="mb-2">
            <PlayerAvatarList playerIds={match.players} maxPlayers={match.maxPlayers} />
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
          <Link href={`/match/${match.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};


const MatchesList = ({ matches, loading, title, icon: Icon, emptyMessage }: { matches: Match[], loading: boolean, title: string, icon: React.ElementType, emptyMessage: string }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MatchCardSkeleton />
                <MatchCardSkeleton />
            </div>
        );
    }
    
    if (matches.length === 0) {
       return null;
    }

    return (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Icon className="h-5 w-5" />
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    )
}

const statusOrder = {
  'ongoing': 1,
  'processing': 2,
  'verification': 3,
  'disputed': 4,
  'open': 5,
  'completed': 6,
  'cancelled': 7,
};

export default function MyMatchesPage() {
  const { user } = useUser();
  
  const queryOptions = useMemo(() => ({
    where: ['players', 'array-contains', user?.uid || ''],
    orderBy: [['createdAt', 'desc'] as const],
    limit: 50,
  }), [user]);

  const { data: myMatches, loading } = useCollection<Match>('matches', queryOptions);

  const { openMatches, myActiveMatches, archivedMatches } = useMemo(() => {
    if (!myMatches) return { openMatches: [], myActiveMatches: [], archivedMatches: [] };

    const sortedMatches = myMatches.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    
    const open: Match[] = [];
    const active: Match[] = [];
    const archived: Match[] = [];

    for (const match of sortedMatches) {
        if (['completed', 'cancelled'].includes(match.status)) {
            archived.push(match);
        } else if (match.status === 'open') {
            open.push(match);
        } else {
            active.push(match);
        }
    }
    
    return { openMatches: open, myActiveMatches: active, archivedMatches: archived };

  }, [myMatches]);

  return (
    <AppShell pageTitle="My Matches" showBackButton>
      <div className="p-4 space-y-8">
        
        {loading ? (
             <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MatchCardSkeleton />
                    <MatchCardSkeleton />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MatchCardSkeleton />
                </div>
            </div>
        ) : myMatches.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">No Matches Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    You haven't joined or created any matches yet.
                </p>
                 <Button asChild className="mt-4">
                    <Link href="/matches">Explore Matches</Link>
                </Button>
            </div>
        ) : (
            <>
                <MatchesList
                    matches={myActiveMatches}
                    loading={loading}
                    title="My Active Matches"
                    icon={Gamepad2}
                    emptyMessage="You have no active matches."
                />

                <MatchesList
                    matches={openMatches}
                    loading={loading}
                    title="Waiting for Players"
                    icon={Hourglass}
                    emptyMessage="No open matches found."
                />

                {archivedMatches.length > 0 && (
                    <div className="space-y-4">
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-dashed" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-2 text-sm text-muted-foreground">Archived Matches</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {archivedMatches.map((match) => (
                                <MatchCard key={match.id} match={match} />
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </AppShell>
  );
}
