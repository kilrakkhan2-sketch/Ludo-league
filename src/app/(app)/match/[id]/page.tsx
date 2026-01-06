
'use client';
import Image from 'next/image';
import { SubmitResultForm } from '@/components/app/submit-result-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Copy,
  Crown,
  ShieldCheck,
  Swords,
  Users,
  Wallet,
  Loader2,
  Info,
  Trash2,
  LogOut,
  Gamepad2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import {
  doc,
  onSnapshot,
  runTransaction,
  collection,
  Timestamp,
  arrayRemove,
  updateDoc,
  getDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Match } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RoomCodeManager = ({ match, isCreator }: { match: Match, isCreator: boolean }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRoomCode = async () => {
    if (!firestore || !roomCode) {
      toast({ title: 'Please enter a room code.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      await updateDoc(matchRef, {
        roomCode: roomCode,
        status: 'in-progress',
      });
      toast({ title: 'Room code submitted!', description: 'The match is now in progress.' });
    } catch (error: any) {
      toast({ title: 'Error submitting code', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRoomCode = () => {
    if (match.roomCode) {
      navigator.clipboard.writeText(match.roomCode);
      toast({ title: 'Room code copied!' });
    }
  };
  
  const handleOpenLudoKing = () => {
    window.location.href = 'ludoking://';
  }

  // Creator's view to ENTER room code when match is full but code not set yet
  if (isCreator && !match.roomCode && match.playerIds.length === match.maxPlayers && match.status === 'waiting') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enter Room Code</CardTitle>
          <CardDescription>
            The match is full. Please create a room in Ludo King and enter the
            code below to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="room-code">Ludo King Room Code</Label>
          <Input id="room-code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="e.g., 01234567" />
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmitRoomCode} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
            Submit Code & Start Match
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Joiner's view to WAIT for room code
  if (!isCreator && !match.roomCode && match.playerIds.length === match.maxPlayers && match.status === 'waiting') {
     return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting for Room Code</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-3 text-muted-foreground p-8">
            <Loader2 className="h-6 w-6 animate-spin"/>
            <p className="font-semibold">The match creator is generating the room code...</p>
        </CardContent>
      </Card>
    );
  }

  // View for BOTH players after code is submitted (Play stage)
  if (match.roomCode) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary"/> Play Now!
                </CardTitle>
                <CardDescription>Use the room code to join the match in your Ludo King app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Ludo King Room Code</Label>
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg mt-1">
                        <p className="text-lg font-mono tracking-widest font-bold text-primary">{match.roomCode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopyRoomCode}>
                            <Copy className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
                 <Button onClick={handleOpenLudoKing} className="w-full" variant="accent">
                    Open Ludo King
                 </Button>
            </CardContent>
        </Card>
    )
  }

  return null; // Don't show anything for this component in other states
};


export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || !id) return;
    setLoading(true);
    const matchRef = doc(firestore, 'matches', id);
    const unsubscribe = onSnapshot(matchRef,(doc) => {
        if (doc.exists()) {
          setMatch({ id: doc.id, ...doc.data() } as Match);
        } else {
          console.error('Match not found!');
          setMatch(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching match:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, id]);

  const handleDeleteMatch = async () => {
    if (!firestore ||!user || !match || user.uid !== match.creatorId || match.status !== 'waiting') return;
    setIsActionLoading(true);
  
    try {
      await runTransaction(firestore, async (transaction) => {
        const matchRef = doc(firestore, 'matches', match.id);
        const matchDoc = await transaction.get(matchRef);
  
        if (!matchDoc.exists()) {
          throw new Error('Match does not exist anymore.');
        }
  
        const currentMatchData = matchDoc.data();
        const playersToRefund = currentMatchData.players || [];
        const refundAmount = currentMatchData.entryFee;
  
        // Step 1: READ all player documents first.
        const playerDocsPromises = playersToRefund.map((player: any) =>
          transaction.get(doc(firestore, 'users', player.id))
        );
        const playerDocs = await Promise.all(playerDocsPromises);
  
        // Step 2: Perform all WRITE operations.
        playerDocs.forEach((playerDoc, index) => {
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            const playerRef = playerDoc.ref;
            const newBalance = (playerData.walletBalance || 0) + refundAmount;
  
            // Write 1: Update player balance
            transaction.update(playerRef, { walletBalance: newBalance });
  
            // Write 2: Create refund transaction log
            const refundTransactionRef = doc(collection(firestore, 'transactions'));
            transaction.set(refundTransactionRef, {
              userId: playersToRefund[index].id,
              type: 'refund',
              amount: refundAmount,
              status: 'completed',
              createdAt: Timestamp.now(),
              relatedMatchId: match.id,
              description: `Refund for deleted match ${match.id}`,
            });
          }
        });
  
        // Final Write: Delete the match document
        transaction.delete(matchRef);
      });
  
      toast({
        title: 'Match Deleted',
        description: 'All players have been refunded.',
      });
      router.push('/lobby');
    } catch (error: any) {
      console.error('Error deleting match:', error);
      toast({
        title: 'Error deleting match',
        description: error.message,
        variant: 'destructive',
      });
      setIsActionLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!firestore || !user || !match || user.uid === match.creatorId || match.status !== 'waiting') return;
    setIsActionLoading(true);

    try {
      const matchRef = doc(firestore, 'matches', match.id);
      const userRef = doc(firestore, 'users', user.uid);

      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('User not found');

        const newBalance = (userDoc.data().walletBalance || 0) + match.entryFee;
        transaction.update(userRef, { walletBalance: newBalance });

        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) throw new Error('Match not found');
        const matchData = matchDoc.data();

        const playerToRemove = matchData.players.find((p: any) => p.id === user.uid);

        transaction.update(matchRef, {
          playerIds: arrayRemove(user.uid),
          players: arrayRemove(playerToRemove),
        });

        const transactionRef = doc(collection(firestore, 'transactions'));
        transaction.set(transactionRef, {
          userId: user.uid,
          type: 'refund',
          amount: match.entryFee,
          status: 'completed',
          createdAt: Timestamp.now(),
          relatedMatchId: match.id,
          description: `Left match ${match.id}`,
        });
      });
      toast({
        title: 'You have left the match',
        description: 'Your entry fee has been refunded.',
      });
      router.push('/lobby');
    } catch (error: any) {
      toast({
        title: 'Error leaving match',
        description: error.message,
        variant: 'destructive',
      });
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Match Not Found</AlertTitle>
        <AlertDescription>
          The match you are looking for does not exist or has been removed.
        </AlertDescription>
      </Alert>
    );
  }
  
  const isCreator = user?.uid === match.creatorId;
  const isJoiner = user && match.playerIds.includes(user.uid) && !isCreator;
  const isMatchFull = match.playerIds.length === match.maxPlayers;
  
  // Define visibility for each stage
  const showWaitingForPlayers = match.status === 'waiting' && !isMatchFull;
  const showRoomCodeStage = match.status === 'waiting' && isMatchFull;
  const showPlayAndSubmitStage = match.status === 'in-progress' && !!match.roomCode;
  const showMatchConcluded = ['completed', 'disputed', 'cancelled'].includes(match.status);


  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Match Details</h2>
        <div
          className={cn('text-lg font-semibold px-4 py-2 rounded-lg', {
            'bg-green-100 text-green-800': match.status === 'waiting',
            'bg-blue-100 text-blue-800': match.status === 'in-progress',
            'bg-gray-100 text-gray-800': match.status === 'completed',
            'bg-red-100 text-red-800': match.status === 'disputed',
          })}
        >
          Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2 space-y-8">
            
          {showWaitingForPlayers && (
             <Card>
                <CardHeader>
                    <CardTitle>Waiting for Players</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center gap-3 text-muted-foreground p-8">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                    <p className="font-semibold">Waiting for an opponent to join...</p>
                </CardContent>
            </Card>
           )}

          {showRoomCodeStage && <RoomCodeManager match={match} isCreator={isCreator} />}
          
          {showPlayAndSubmitStage && (
            <>
              <RoomCodeManager match={match} isCreator={isCreator} />
              <SubmitResultForm matchId={match.id} />
            </>
          )}

          {showMatchConcluded && (
            <Card>
              <CardHeader>
                <CardTitle>Match Concluded</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This match has been completed and winnings have been distributed, or it is under review. No further actions can be taken.
                </p>
              </CardContent>
            </Card>
          )}

        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Entry Fee
                </span>
                <span className="font-semibold">₹{match.entryFee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Crown className="h-4 w-4" /> Prize Pool
                </span>
                <span className="font-semibold">₹{match.prizePool}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Players
                </span>
                <span className="font-semibold">
                  {match.playerIds.length} / {match.maxPlayers}
                </span>
              </div>
            </CardContent>
            {match.status === 'waiting' && (
              <CardContent>
                {isCreator && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteMatch}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete Match
                  </Button>
                )}
                {isJoiner && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLeaveMatch}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Leave Match
                  </Button>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.players.map((player: any) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatarUrl} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Win Rate: {player.winRate || 0}%
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    <ShieldCheck className="h-3 w-3 mr-1 text-green-500" />{' '}
                    Verified
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
