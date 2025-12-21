
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc } from '@/firebase';
import { Match, UserProfile, MatchResult } from '@/types';
import { doc, Timestamp, runTransaction, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert, ArrowLeft, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { AdminChatRoom } from '@/components/chat/AdminChatRoom';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'secondary';
    case 'ongoing': return 'default';
    case 'processing': return 'default';
    case 'completed': return 'outline';
    case 'verification': return 'destructive';
    case 'cancelled': return 'outline';
    case 'disputed': return 'destructive';
    default: return 'default';
  }
};

const LoadingSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </div>
);

export default function AdminMatchDetailsPage() {
  const params = useParams();
  const router = useRouter();

  if (!params) {
    return (
        <div>
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Matches</Button>
            <Alert variant="destructive" className="mt-4">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Match Not Found</AlertTitle>
                <AlertDescription>The requested match could not be found because of a missing match ID.</AlertDescription>
            </Alert>
        </div>
    );
  }

  const matchId = params.matchId as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winner, setWinner] = useState('');

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${matchId}`);
  const { data: results, loading: resultsLoading } = useCollection<MatchResult>(`matches/${matchId}/results`);
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_']; 
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
      where: ['uid', 'in', playerIds]
  });
  
  const resultsMap = useMemo(() => {
    const map = new Map<string, MatchResult>();
    if (results) {
      results.forEach(result => map.set(result.userId, result));
    }
    return map;
  }, [results])

  const handleCancelMatch = async () => {
    if (!firestore || !match) return;
    if (!confirm('Are you sure you want to cancel this match and refund all players? This action cannot be undone.')) return;
    
    setIsSubmitting(true);
    try {
        await runTransaction(firestore, async (transaction) => {
            const matchRef = doc(firestore, 'matches', match.id);
            
            for (const playerId of match.players) {
                const playerRef = doc(firestore, 'users', playerId);
                const playerDoc = await transaction.get(playerRef);
                if (playerDoc.exists()) {
                    const currentBalance = playerDoc.data().walletBalance || 0;
                    transaction.update(playerRef, { walletBalance: currentBalance + match.entryFee });
                }
            }

            transaction.update(matchRef, { status: 'cancelled', completedAt: Timestamp.now() });
        });

        toast({ title: 'Success', description: 'Match has been cancelled and players refunded.' });
        router.push('/admin/matches');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeclareWinner = async () => {
    if (!firestore || !match || !winner) return;
    setIsSubmitting(true);
    try {
        const matchRef = doc(firestore, "matches", matchId);
        // The onMatchResultUpdate cloud function will handle prize distribution and stat updates.
        await updateDoc(matchRef, {
            status: "completed",
            winnerId: winner,
            completedAt: Timestamp.now(),
        });

      toast({ title: 'Success', description: `Winner has been declared. The prize will be awarded automatically.` });
      router.push('/admin/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = matchLoading || playersLoading || resultsLoading;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!match) {
    return (
        <div>
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Matches</Button>
            <Alert variant="destructive" className="mt-4">
                <CircleAlert className="h-4 w-4" />
                <AlertTitle>Match Not Found</AlertTitle>
                <AlertDescription>The requested match could not be found.</AlertDescription>
            </Alert>
        </div>
    );
  }

  const getFraudNote = () => {
      if (match.status !== 'disputed') return null;

      const positions = new Map<number, number>();
      let winnerCount = 0;
      results.forEach(r => {
          positions.set(r.confirmedPosition, (positions.get(r.confirmedPosition) || 0) + 1);
          if (r.confirmedWinStatus === 'win') {
              winnerCount++;
          }
      });

      const duplicatePosition = Array.from(positions.entries()).find(([_, count]) => count > 1);
      if (duplicatePosition) {
          return `Multiple players selected position ${duplicatePosition[0]}.`;
      }
      if (winnerCount > 1) {
          return `Multiple players claimed to be the winner.`;
      }
      
      return 'Result conflict detected. Please review submissions carefully.';
  }

  return (
    <div className="space-y-6">
        <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Matches
            </Button>
            <h1 className="text-3xl font-bold font-headline">Manage Match: {match.title}</h1>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Match Details</CardTitle>
                            <CardDescription>ID: {match.id}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Entry Fee</p><p className="font-semibold">₹{match.entryFee}</p></div>
                        <div><p className="text-muted-foreground">Prize Pool</p><p className="font-semibold">₹{match.prizePool}</p></div>
                        <div><p className="text-muted-foreground">Players</p><p className="font-semibold">{match.players.length} / {match.maxPlayers}</p></div>
                        <div><p className="text-muted-foreground">Created</p><p className="font-semibold">{match.createdAt ? new Date(match.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p></div>
                    </div>
                    {match.status === 'disputed' && (
                        <Alert variant="destructive">
                            <CircleAlert className="h-4 w-4" />
                            <AlertTitle>Fraud Detected</AlertTitle>
                            <AlertDescription>{getFraudNote()}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Submitted Results</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-muted-foreground">
                                    <th className="p-2">Player</th>
                                    <th className="p-2">Selected Position</th>
                                    <th className="p-2">Win / Loss</th>
                                    <th className="p-2">Screenshot</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(player => {
                                    const result = resultsMap.get(player.id);
                                    const isWinner = result?.confirmedWinStatus === 'win';
                                    const isDisputed = results.filter(r => r.confirmedPosition === result?.confirmedPosition).length > 1;

                                    return (
                                        <tr key={player.id} className="border-t">
                                            <td className="p-2 font-medium">{player.displayName}</td>
                                            <td className={`p-2 font-semibold ${isDisputed ? 'text-destructive' : ''}`}>{result?.confirmedPosition ? `${result.confirmedPosition}${isDisputed ? ' ❌' : ''}` : 'N/A'}</td>
                                            <td className={`p-2 font-semibold capitalize ${isWinner ? 'text-green-500' : 'text-gray-500'}`}>{result?.confirmedWinStatus || 'N/A'}</td>
                                            <td className="p-2">
                                                {result?.screenshotUrl ? (
                                                    <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                                        <Image src={result.screenshotUrl} alt={`Screenshot from ${player.displayName}`} width={80} height={45} className="rounded-md object-cover"/>
                                                    </a>
                                                ) : 'No Screenshot'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <AdminChatRoom contextPath={`matches/${matchId}`} />
        </div>
        <div className="sticky top-20">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    { (match.status === 'verification' || match.status === 'disputed') && (
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                <Label>Declare Winner</Label>
                                <Select onValueChange={setWinner} value={winner}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a player to award prize" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleDeclareWinner} disabled={isSubmitting || !winner} className="w-full">
                                <Trophy className="mr-2 h-4 w-4" /> Declare Winner & Payout
                                </Button>
                            </div>

                             <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                            </div>
                            
                            <div>
                                <Button variant='destructive' onClick={handleCancelMatch} disabled={isSubmitting} className="w-full">Cancel Match & Refund Players</Button>
                                <p className='text-xs text-muted-foreground pt-2'>This will refund the entry fee to all players and close the match.</p>
                            </div>
                        </div>
                    )}
                     
                     {(match.status === 'completed' || match.status === 'cancelled') && (
                        <Alert>
                            <CircleAlert className="h-4 w-4" />
                            <AlertTitle>Action Completed</AlertTitle>
                            <AlertDescription>
                                This match has already been processed and no further actions can be taken.
                                {match.winnerId && <p className="mt-2"><strong>Winner:</strong> {players.find(p => p.id === match.winnerId)?.displayName || 'N/A'}</p>}
                            </AlertDescription>
                        </Alert>
                     )}
                     {match.status === 'open' || match.status === 'ongoing' || match.status === 'processing' && (
                          <Alert>
                            <CircleAlert className="h-4 w-4" />
                            <AlertTitle>Match In Progress</AlertTitle>
                            <AlertDescription>
                                No actions can be taken until all results are submitted or the match is disputed.
                            </AlertDescription>
                        </Alert>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
