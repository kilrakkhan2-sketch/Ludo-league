
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
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser } from '@/firebase';
import type { Match } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalance } from '@/components/wallet-balance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
        return 'default';
      case 'completed':
        return 'outline';
      case 'disputed':
        return 'destructive';
      case 'processing':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="p-4 bg-muted/30">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-bold truncate pr-2">{match.title}</CardTitle>
          <Badge variant={getStatusVariant(match.status)} className="capitalize shrink-0">
            {isFull && match.status === 'open' ? 'Full' : match.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs pt-1">
          <Users className="h-3 w-3" />
          <span>
            {match.players.length} of {match.maxPlayers} Players
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow grid grid-cols-2 gap-4">
        <div className="text-center">
            <p className="text-xs text-muted-foreground">Entry Fee</p>
            <p className="font-bold text-lg text-primary">₹{match.entryFee}</p>
        </div>
         <div className="text-center border-l">
            <p className="text-xs text-muted-foreground">Winning Prize</p>
            <p className="font-bold text-lg text-green-600">₹{match.prizePool}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-2">
        <Button asChild className="w-full">
          <Link href={`/match/${match.id}`}>
            {isFull || match.status !== 'open' ? 'View Match' : 'Join Now'}
          </Link>
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
            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Matches Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    There are no matches in this category right now.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/create-match">Create the first one!</Link>
                </Button>
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
    if (filter === 'all') return allMatches;
    if (filter === 'my-matches') {
        return allMatches.filter(m => user && m.players.includes(user.uid));
    }
    return allMatches.filter(m => m.status === filter);
  }, [allMatches, filter, user]);

  return (
    <AppShell pageTitle="Matches">
        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-16 sm:top-0 z-10">
            <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <WalletBalance />
            </div>
            <Button asChild>
                <Link href="/create-match">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Match
                </Link>
            </Button>
        </div>
      <div className="p-4 space-y-6">
         <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="my-matches">My Matches</TabsTrigger>
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
            <TabsContent value="my-matches">
                <MatchesList matches={filteredMatches} loading={loading} />
            </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
