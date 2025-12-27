
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Users, Trophy, Gamepad2, Hourglass, History } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useUser, useDoc } from '@/firebase';
import type { Match, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayerAvatarList } from '@/components/matches/PlayerAvatarList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import type { VariantProps } from 'class-variance-authority';

const MatchCardSkeleton = () => (
  <Card>
    <CardHeader className="p-3 sm:p-4"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
    <CardContent className="p-3 sm:p-4 pt-0"><Skeleton className="h-8 w-full" /></CardContent>
    <CardFooter className="flex justify-between items-center py-3 px-3 sm:px-4"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-10 w-20" /></CardFooter>
  </Card>
);

const MyMatchCard = ({ match }: { match: Match }) => {
  const { user } = useUser();
  const { data: winnerProfile } = useDoc<UserProfile>(match.winnerId ? `users/${match.winnerId}` : undefined);

  const getStatusInfo = (status: Match['status']): { variant: VariantProps<typeof badgeVariants>["variant"], text: string } => {
    switch (status) {
      case 'waiting': return { variant: 'outline', text: 'Waiting' };
      case 'room_code_pending':
      case 'room_code_shared':
      case 'game_started': return { variant: 'default', text: 'In Progress' };
      case 'result_submitted':
      case 'verification': return { variant: 'secondary', text: 'Verifying' };
      case 'FLAGGED': return { variant: 'destructive', text: 'Disputed' };
      case 'PAID': return { variant: 'success', text: 'Completed' };
      case 'cancelled': return { variant: 'destructive', text: 'Cancelled' };
      default: return { variant: 'default', text: status };
    }
  };

  const statusInfo = getStatusInfo(match.status);
  const isWinner = user?.uid === match.winnerId;
  const isArchived = ['PAID', 'cancelled'].includes(match.status);

  return (
    <Card className="relative overflow-hidden flex flex-col hover:shadow-lg transition-shadow bg-card border">
        <Image
            src="/logo.svg"
            alt="LudoLeague Watermark"
            width={120}
            height={120}
            className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-5 pointer-events-none"
        />
      <CardHeader className="p-3 sm:p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base leading-tight truncate">{match.title}</CardTitle>
          <Badge variant={statusInfo.variant} className="capitalize shrink-0">{statusInfo.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 flex-grow space-y-3">
        <PlayerAvatarList playerIds={match.players} maxPlayers={match.maxPlayers} />
        {isArchived && (
          <div className='text-sm font-medium'>
            {match.status === 'PAID' ? (
              <p className={isWinner ? 'text-green-600' : 'text-red-600'}>
                {isWinner ? `You Won ₹${(match.prizePool * 0.9).toFixed(2)}` : `Winner: ${winnerProfile?.displayName || '...'}`}
              </p>
            ) : (
              <p className='text-muted-foreground'>Entry fee was refunded.</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-3 sm:px-4">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <p className="text-lg font-bold">₹{match.prizePool}</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/match/${match.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const MatchesGrid = ({ matches, loading, count, emptyState }: { matches: Match[], loading: boolean, count: number, emptyState: React.ReactNode }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(count)].map((_, i) => <MatchCardSkeleton key={i} />)}
            </div>
        );
    }
    
    if (matches.length === 0) {
       return <>{emptyState}</>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => <MyMatchCard key={match.id} match={match} />)}
        </div>
    )
}

const EmptyState = ({ title, description, buttonText, buttonLink }: { title: string, description: string, buttonText: string, buttonLink: string }) => (
    <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">{description}</p>
        <Button asChild><Link href={buttonLink}>{buttonText}</Link></Button>
    </div>
);

export default function MyMatchesPage() {
  const { user } = useUser();
  
  const queryOptions = useMemo(() => ({
    where: user ? ['players', 'array-contains', user.uid] as const : undefined,
    orderBy: [['createdAt', 'desc'] as const],
    limit: 50,
  }), [user]);

  const { data: myMatches, loading } = useCollection<Match>('matches', queryOptions);

  const { activeMatches, waitingMatches, historyMatches } = useMemo(() => {
    if (!myMatches) return { activeMatches: [], waitingMatches: [], historyMatches: [] };
    
    const active: Match[] = [];
    const waiting: Match[] = [];
    const history: Match[] = [];

    for (const match of myMatches) {
        if (['PAID', 'cancelled'].includes(match.status)) {
            history.push(match);
        } else if (match.status === 'waiting') {
            waiting.push(match);
        } else {
            active.push(match);
        }
    }
    return { activeMatches: active, waitingMatches: waiting, historyMatches: history };

  }, [myMatches]);

  return (
    <AppShell pageTitle="My Matches" showBackButton>
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active"><Gamepad2 className="h-4 w-4 sm:mr-2"/> <span className="hidden sm:inline">Active</span></TabsTrigger>
            <TabsTrigger value="waiting"><Hourglass className="h-4 w-4 sm:mr-2"/> <span className="hidden sm:inline">Waiting</span></TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 sm:mr-2"/> <span className="hidden sm:inline">History</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <MatchesGrid 
              matches={activeMatches}
              loading={loading}
              count={2}
              emptyState={<EmptyState title="No Active Matches" description="Join or create a match to see it here." buttonText="Find a Match" buttonLink="/" />} 
            />
          </TabsContent>
          
          <TabsContent value="waiting">
             <MatchesGrid 
              matches={waitingMatches}
              loading={loading}
              count={1}
              emptyState={<EmptyState title="No Waiting Matches" description="Matches you create that are waiting for players will appear here." buttonText="Create a Match" buttonLink="/create-match" />} 
            />
          </TabsContent>
          
          <TabsContent value="history">
             <MatchesGrid 
              matches={historyMatches}
              loading={loading}
              count={3}
              emptyState={<EmptyState title="No Match History" description="Your completed or cancelled matches will be shown here." buttonText="Play a Game" buttonLink="/" />} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
