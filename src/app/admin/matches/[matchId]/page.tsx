
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc } from '@/firebase';
import { Match, UserProfile } from '@/types';
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

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'secondary';
    case 'ongoing': return 'default';
    case 'completed': 'default';
    case 'verification': return 'destructive';
    case 'cancelled': return 'outline';
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
  const matchId = params.matchId as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winner, setWinner] = useState('');

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${matchId}`);
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_']; 
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
      where: ['uid', 'in', playerIds]
  });

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

            transaction.update(matchRef, { status: 'cancelled', processedAt: Timestamp.now() });
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
        });

      toast({ title: 'Success', description: `Winner has been declared. The prize will be awarded automatically.` });
      router.push('/admin/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = matchLoading || playersLoading;

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
                    <CardTitle>Match Details</CardTitle>
                    <CardDescription>ID: {match.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="text-sm text-muted-foreground">Status</p><Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status}</Badge></div>
                        <div><p className="text-sm text-muted-foreground">Entry Fee</p><p className="font-semibold">₹{match.entryFee}</p></div>
                        <div><p className="text-sm text-muted-foreground">Prize Pool</p><p className="font-semibold">₹{match.prizePool}</p></div>
                        <div><p className="text-sm text-muted-foreground">Players</p><p className="font-semibold">{match.players.length} / {match.maxPlayers}</p></div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Submitted Results</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {match.results && match.results.length > 0 ? match.results.map((result, index) => {
                       const player = players.find(p => p.id === result.userId);
                       return (
                           <div key={index} className="border p-4 rounded-lg">
                                <p><strong>Player:</strong> {player?.displayName || 'Unknown'}</p>
                                <p><strong>Claimed Status:</strong> <Badge variant={result.status === 'won' ? 'default' : 'destructive'}>{result.status}</Badge></p>
                                <p><strong>Screenshot:</strong></p>
                                <div className="relative aspect-video w-full max-w-md mt-2 rounded-md overflow-hidden border">
                                    <Image src={result.screenshotUrl} alt={`Result from ${player?.displayName}`} layout="fill" objectFit="contain" />
                                </div>
                           </div>
                       )
                    }) : <p className="text-muted-foreground">No results have been submitted for this match yet.</p>}
                </CardContent>
            </Card>
        </div>
        <div className="sticky top-20">
            <Card>
                <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    { (match.status === 'verification') && (
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
                               <Trophy className="mr-2 h-4 w-4" /> Declare Winner
                            </Button>
                        </div>
                    )}
                     {(match.status === 'open' || match.status === 'ongoing') && (
                        <div>
                             <Button variant='destructive' onClick={handleCancelMatch} disabled={isSubmitting} className="w-full">Cancel Match & Refund Players</Button>
                             <p className='text-xs text-muted-foreground pt-2'>This will refund the entry fee to all players.</p>
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
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
