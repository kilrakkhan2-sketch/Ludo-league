
'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useUser, useFirebase } from '@/firebase';
import type { Match } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalance } from '@/components/wallet-balance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


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
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [isJoining, setIsJoining] = useState(false);

  const isFull = match.players.length >= match.maxPlayers;
  const hasJoined = user ? match.players.includes(user.uid) : false;

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

  const handleJoinMatch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore || hasJoined || isFull) return;
    setIsJoining(true);

    const matchRef = doc(firestore, 'matches', match.id);
    const userRef = doc(firestore, 'users', user.uid);

    try {
        await runTransaction(firestore, async (transaction) => {
            const matchDoc = await transaction.get(matchRef);
            const userDoc = await transaction.get(userRef);

            if (!matchDoc.exists() || !userDoc.exists()) {
                throw new Error("Match or user does not exist.");
            }

            const matchData = matchDoc.data();
            const userData = userDoc.data();

            if (matchData.players.length >= matchData.maxPlayers) {
                throw new Error("Match is already full.");
            }
            if (userData.walletBalance < matchData.entryFee) {
                throw new Error("Insufficient wallet balance.");
            }
            if (matchData.players.includes(user.uid)) {
                // This case should ideally not be reached if UI is correct, but as a safeguard.
                throw new Error("You have already joined this match.");
            }

            transaction.update(userRef, { walletBalance: userData.walletBalance - matchData.entryFee });
            
            const updatedPlayers = [...matchData.players, user.uid];
            transaction.update(matchRef, { players: updatedPlayers });

            if (updatedPlayers.length === matchData.maxPlayers) {
                transaction.update(matchRef, {
                    status: 'ongoing',
                    startedAt: Timestamp.now()
                });
            }
        });

        toast({ title: "Successfully Joined!", description: `Redirecting you to the match.` });
        router.push(`/match/${match.id}`);
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Could not join match", description: error.message });
    } finally {
        setIsJoining(false);
    }
  };

  const showJoinButton = match.status === 'open' && !isFull && !hasJoined;

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
      <Link href={`/match/${match.id}`} className="flex flex-col flex-grow">
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
      </Link>
      <CardFooter className="bg-muted/30 p-2">
        {showJoinButton ? (
          <Button onClick={handleJoinMatch} disabled={isJoining} className="w-full">
            {isJoining ? 'Joining...' : 'Join Now'}
          </Button>
        ) : (
          <Button asChild className="w-full" variant="outline">
            <Link href={`/match/${match.id}`}>
              {hasJoined || match.status !== 'open' ? 'View Match' : 'Match Full'}
            </Link>
          </Button>
        )}
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
        <div className="bg-background/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-14 sm:top-0 z-10 border-b">
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

    