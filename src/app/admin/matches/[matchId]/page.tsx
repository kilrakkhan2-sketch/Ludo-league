
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminShell } from "@/components/layout/AdminShell";
import { useCollection, useDoc, useUser } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { doc, writeBatch, Timestamp, runTransaction } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'secondary';
    case 'in-progress': return 'default';
    case 'completed': return 'success';
    case 'disputed': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'default';
  }
};

export default function AdminMatchDetailsPage() {
  const { matchId } = useParams();
  const { firestore } = useFirebase();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winner, setWinner] = useState('');

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${matchId}`);
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_']; // Return a placeholder to avoid empty 'in' query
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
      where: ['uid', 'in', playerIds]
  });

  const playersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    players.forEach((p: UserProfile) => map.set(p.uid, p));
    return map;
  }, [players]);

  const handleCancelMatch = async () => {
    if (!firestore || !match) return;
    setIsSubmitting(true);
    try {
        // This logic should ideally be a Cloud Function for atomicity.
        await runTransaction(firestore, async (transaction) => {
            const matchRef = doc(firestore, 'matches', match.id);
            
            // 1. Refund each player
            for (const playerId of match.players) {
                const playerRef = doc(firestore, 'users', playerId);
                const playerDoc = await transaction.get(playerRef);
                if (playerDoc.exists()) {
                    const currentBalance = playerDoc.data().walletBalance || 0;
                    transaction.update(playerRef, { walletBalance: currentBalance + match.entryFee });
                }
            }

            // 2. Update the match status
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
        // This logic should ideally be a Cloud Function for atomicity.
        await runTransaction(firestore, async (transaction) => {
            const matchRef = doc(firestore, 'matches', match.id);
            const winnerRef = doc(firestore, 'users', winner);

            // 1. Award prize to the winner
            const winnerDoc = await transaction.get(winnerRef);
            if (winnerDoc.exists()) {
                const currentBalance = winnerDoc.data().walletBalance || 0;
                transaction.update(winnerRef, { walletBalance: currentBalance + match.prizePool });
            }

            // 2. Update match status
            transaction.update(matchRef, { status: 'completed', winner, processedAt: Timestamp.now() });
        });

      toast({ title: 'Success', description: `Winner has been declared and prize awarded.` });
      router.push('/admin/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = matchLoading || playersLoading;

  if (loading) {
    return <AdminShell pageTitle='Loading...'><div>Loading match details...</div></AdminShell>;
  }

  if (!match) {
    return <AdminShell pageTitle='Error'><div>Match not found.</div></AdminShell>;
  }

  return (
    <AdminShell pageTitle={`Manage Match: ${match.title}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                    <CardDescription>ID: {match.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Status:</strong> <Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status}</Badge></p>
                    <p><strong>Entry Fee:</strong> ₹{match.entryFee}</p>
                    <p><strong>Prize Pool:</strong> ₹{match.prizePool}</p>
                    <div>
                        <strong>Players:</strong> {match.players.length} / {match.maxPlayers}
                        <div className="flex flex-col gap-2 pt-2">
                            {players.map(p => (
                                <div key={p.uid} className="flex items-center gap-2 p-2 border rounded-md">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={p.photoURL || undefined} />
                                        <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{p.displayName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {match.status === 'disputed' && (
                        <div className='space-y-2'>
                            <label>Declare Winner</label>
                            <Select onValueChange={setWinner} value={winner}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a player" />
                                </SelectTrigger>
                                <SelectContent>
                                    {players.map(p => <SelectItem key={p.uid} value={p.uid}>{p.displayName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDeclareWinner} disabled={isSubmitting || !winner} className="w-full">Declare Winner & Award Prize</Button>
                        </div>
                    )}
                     {(match.status === 'open' || match.status === 'in-progress') && (
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
                            </Aler tDescription>
                        </Alert>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminShell>
  );
}
