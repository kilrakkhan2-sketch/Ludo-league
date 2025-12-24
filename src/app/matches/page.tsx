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
import { Users, Trophy, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser } from '@/firebase';
import type { Match } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalance } from '@/components/wallet-balance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        return 'destructive';
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


const MatchesList = ({ matches, loading }: { matches: Match[], loading: boolean }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MatchCardSkeleton />
                <MatchCardSkeleton />
                <MatchCardSkeleton />
                <MatchCardSkeleton />
            </div>
        );
    }
    
    if (matches.length === 0) {
        return (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">No Matches Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    There are no matches in this category.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
            ))}
        </div>
    )
}

export default function MatchesPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState('all');
  
  const queryOptions = useMemo(() => ({
    orderBy: [['createdAt', 'desc'] as const],
    limit: 50,
  }), []);

  const { data: allMatches, loading } = useCollection<Match>('matches', queryOptions);

  const filteredMatches = useMemo(() => {
    if (!allMatches) return [];
    
    const activeMatches = allMatches.filter(m => !['completed', 'cancelled'].includes(m.status));

    if (filter === 'open') {
        return activeMatches.filter(m => m.status === 'open' && m.players.length < m.maxPlayers);
    }
     if (filter === 'ongoing') {
        return activeMatches.filter(m => ['ongoing', 'processing', 'verification', 'disputed'].includes(m.status) || (m.status === 'open' && m.players.length >= m.maxPlayers));
    }
    // 'all' filter
    return activeMatches;
  }, [allMatches, filter]);

  return (
    <AppShell pageTitle="Matches">
      <div className="p-4 space-y-6">
        <div className="bg-card p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <WalletBalance />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Button asChild variant="outline" className="flex-1">
                    <Link href="/matches/my-matches">
                        My Matches
                    </Link>
                </Button>
                <Button asChild className="flex-1">
                    <Link href="/create-match">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Match
                    </Link>
                </Button>
            </div>
        </div>

         <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
                <MatchesList matches={filteredMatches} loading={loading} />
            </TabsContent>
             <TabsContent value="open">
                <MatchesList matches={filteredMatches} loading={loading} />
            </TabsContent>
            <TabsContent value="ongoing">
                <MatchesList matches={filteredMatches} loading={loading} />
            </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
