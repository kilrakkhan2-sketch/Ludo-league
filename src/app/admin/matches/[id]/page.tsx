
'use client';

import { useState, useMemo } from 'react';
import { useDoc, useCollection, useFunctions } from "@/firebase";
import { Match, MatchResult, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PlayerResultCard = ({ result, player }: { result: MatchResult; player: UserProfile | undefined }) => (
    <Card>
        <CardHeader className='text-center'>
            <Avatar className='mx-auto h-16 w-16 mb-2'>
                <AvatarImage src={player?.photoURL || ''} />
                <AvatarFallback>{player?.displayName?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <CardTitle>{player?.displayName}</CardTitle>
            <CardDescription>Submitted: {result.winStatus}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
            <div className='font-semibold text-center text-lg'>Position Claimed: {result.position}</div>
            {result.screenshotUrl ? (
                <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img src={result.screenshotUrl} alt={`Screenshot from ${player?.displayName}`} className="rounded-md w-full aspect-video object-cover" />
                </a>
            ) : (
                <div className='text-center text-muted-foreground'>No screenshot submitted.</div>
            )}
        </CardContent>
    </Card>
);

export default function AdminMatchReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const functions = useFunctions();
  const [isLoading, setIsLoading] = useState(false);

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  const { data: results, loading: resultsLoading } = useCollection<MatchResult>(`matches/${params.id}/results`);

  const playerIds = useMemo(() => match?.players || [], [match]);
  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', 
    playerIds.length > 0 ? { where: ['uid', 'in', playerIds] } : undefined
  );

  const loading = matchLoading || resultsLoading || playersLoading;

  const handleResolve = async (winnerId: string) => {
    if (!functions || !match || !window.confirm(`Are you sure you want to declare this player the winner? This will transfer the prize money.`)) return;

    setIsLoading(true);
    const resolveMatchFn = httpsCallable(functions, 'resolveFlaggedMatch');
    try {
      await resolveMatchFn({ matchId: match.id, winnerId: winnerId });
      toast({ title: 'Match Resolved', description: 'The winner has been paid.' });
      router.push('/admin/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Resolution Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!functions || !match || !window.confirm('Are you sure you want to cancel this match? This will refund the entry fee to both players.')) return;

    setIsLoading(true);
    const cancelMatchFn = httpsCallable(functions, 'cancelFlaggedMatch');
    try {
      await cancelMatchFn({ matchId: match.id });
      toast({ title: 'Match Cancelled', description: 'Entry fees have been refunded.' });
      router.push('/admin/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Cancellation Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className='p-4'><Skeleton className='h-screen w-full' /></div>;
  }

  if (!match) {
    return <div>Match not found.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <header className='flex items-center gap-4'>
         <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold">Review Flagged Match</h1>
            <p className='text-muted-foreground font-mono text-sm'>{match.id}</p>
        </div>
      </header>

      {match.fraudReasons && match.fraudReasons.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle />Fraud Flags Detected</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-2">
                  {match.fraudReasons.map((reason, index) => (
                      <Badge key={index} variant="destructive">{reason.replace(/_/g, ' ')}</Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map(result => {
            const player = players.find(p => p.uid === result.userId);
            return <PlayerResultCard key={result.id} result={result} player={player} />;
        })}
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Review the evidence above and choose an action. This is final and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(player => (
                <Button key={player.uid} variant='outline' size='lg' onClick={() => handleResolve(player.uid)} disabled={isLoading}>
                    <Crown className='mr-2 h-4 w-4 text-yellow-500' />
                    Declare {player.displayName} as Winner
                </Button>
            ))}
             <Button variant='destructive' size='lg' onClick={handleCancel} disabled={isLoading}>
                Cancel Match & Refund All
            </Button>
        </CardContent>
       </Card>

    </div>
  );
}
