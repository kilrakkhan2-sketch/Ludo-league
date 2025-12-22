'use client';

import { useState, useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useFirebase } from '@/firebase';
import type { Match, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalance } from '@/components/wallet-balance';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const MatchListItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm border">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="text-right">
      <Skeleton className="h-5 w-16 mb-1" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

const MatchListItem = ({ match, creator }: { match: Match, creator?: UserProfile }) => {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const hasJoined = useMemo(() => user && match.players.includes(user.uid), [user, match.players]);
  const isFull = match.players.length >= match.maxPlayers;
  const canJoin = match.status === 'open' && !isFull && !hasJoined;

  const handleJoinMatch = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the link from navigating
    e.preventDefault();

    if (!canJoin || !user || !firestore) return;
    setIsJoining(true);

    const matchRef = doc(firestore, 'matches', match.id);
    const userRef = doc(firestore, 'users', user.uid);

    try {
        await runTransaction(firestore, async (transaction) => {
            const matchDoc = await transaction.get(matchRef);
            const userDoc = await transaction.get(userRef);

            if (!matchDoc.exists() || !userDoc.exists()) throw new Error("Match or user not found.");
            
            const matchData = matchDoc.data();
            const userData = userDoc.data();

            if (matchData.players.length >= matchData.maxPlayers) throw new Error("Match is already full.");
            if (userData.walletBalance < matchData.entryFee) throw new Error("Insufficient funds.");

            // 1. Deduct fee and add user to match
            transaction.update(userRef, { walletBalance: userData.walletBalance - matchData.entryFee });
            const updatedPlayers = [...matchData.players, user.uid];
            transaction.update(matchRef, { players: updatedPlayers });

            // 2. If match is now full, update its status
            if (updatedPlayers.length === matchData.maxPlayers) {
                transaction.update(matchRef, { status: 'ongoing', startedAt: Timestamp.now() });
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
  
  return (
    <Link href={`/match/${match.id}`} className="block">
        <div className="bg-card rounded-lg shadow-sm border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
                {/* Left Side: Player Info */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={creator?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${match.creatorId}`} />
                        <AvatarFallback>{creator?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xs text-muted-foreground">Challenge by {creator?.displayName || "..."}</p>
                        <p className="font-semibold">{match.title}</p>
                    </div>
                </div>

                {/* Right Side: Fee & Action */}
                <div className="text-right">
                    <p className="font-bold text-primary text-lg">₹{match.entryFee}</p>
                    {canJoin ? (
                         <Button size="sm" onClick={handleJoinMatch} disabled={isJoining}>{isJoining ? 'Joining...' : 'Join'}</Button>
                    ) : (
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/match/${match.id}`}>View</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </Link>
  );
};


export default function MatchesPage() {
  const { user } = useUser();
  
  const queryOptions = useMemo(() => ({
    where: ['status', 'in', ['open', 'ongoing']],
    orderBy: [['createdAt', 'desc'] as const],
    limit: 50,
  }), []);

  const { data: matches, loading } = useCollection<Match>('matches', queryOptions);

  const creatorIds = useMemo(() => {
    if (!matches || matches.length === 0) return ['_']; // Firestore 'in' query needs a non-empty array
    const ids = new Set(matches.map(m => m.creatorId));
    return Array.from(ids);
  }, [matches]);

  const usersQueryOptions = useMemo(() => ({ where: [['uid', 'in', creatorIds] as const] }), [creatorIds]);
  const { data: creators, loading: creatorsLoading } = useCollection<UserProfile>('users', usersQueryOptions);
  
  const creatorsMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    if(creators) {
      creators.forEach(c => map.set(c.uid, c));
    }
    return map;
  }, [creators]);

  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
        const isMyMatchA = a.creatorId === user?.uid || a.players.includes(user?.uid || '');
        const isMyMatchB = b.creatorId === user?.uid || b.players.includes(user?.uid || '');
        if (isMyMatchA && !isMyMatchB) return -1;
        if (!isMyMatchA && isMyMatchB) return 1;
        return 0;
    });
  }, [matches, user]);
    
  const isLoading = loading || (matches && matches.length > 0 && creatorsLoading);

  return (
    <AppShell pageTitle="Matches">
        <div className="bg-background/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-14 z-10 border-b">
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
        <div className="p-4 space-y-3">
            {isLoading ? (
                <>
                    <MatchListItemSkeleton />
                    <MatchListItemSkeleton />
                    <MatchListItemSkeleton />
                    <MatchListItemSkeleton />
                </>
            ) : sortedMatches.length > 0 ? (
                sortedMatches.map((match) => (
                    <MatchListItem key={match.id} match={match} creator={creatorsMap.get(match.creatorId)} />
                ))
            ) : (
                <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No Matches Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        There are no matches available right now.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/create-match">Create the first one!</Link>
                    </Button>
                </div>
            )}
        </div>
    </AppShell>
  );
}
