
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
import { Button, buttonVariants } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import {
  doc,
  onSnapshot,
  runTransaction,
  collection,
  Timestamp,
  arrayRemove,
  updateDoc,
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

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
    if (value.length <= 8) {
      setRoomCode(value);
    }
  };

  const handleSubmitRoomCode = async () => {
    if (!/^\d{8}$/.test(roomCode)) {
      toast({
        title: 'Invalid Room Code',
        description: 'Room code must be exactly 8 digits.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!firestore) {
      toast({ title: 'An error occurred. Please try again.', variant: 'destructive' });
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
          <Input 
            id="room-code" 
            value={roomCode} 
            onChange={handleRoomCodeChange} 
            placeholder="8-digit code"
            type="text"
            inputMode="numeric"
            maxLength={8}
            pattern="\d{8}"
          />
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
                    <div className="flex items-center justify-between bg-gradient-to-r from-primary-start to-primary-end text-primary-foreground p-3 rounded-lg mt-1 shadow-md">
                        <p className="text-2xl font-mono tracking-widest font-bold">{match.roomCode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopyRoomCode} className='hover:bg-white/20'>
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                 <a href="ludoking://" className={cn(buttonVariants({ variant: "accent" }), "w-full")}>
                    Open Ludo King
                 </a>
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
  const { user, userProfile } = useUser();
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
          toast({ title: "Match not found", description: "This match may have been deleted or never existed.", variant: "destructive" });
          router.push('/lobby');
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
  }, [firestore, id, router, toast]);

  useEffect(() => {
    // When a match is cancelled or deleted, remove the activeMatchId from the user's profile
    if (user && userProfile && match && ['cancelled', 'completed', 'disputed'].includes(match.status)) {
      if (userProfile.activeMatchId === match.id) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDoc(userRef, { activeMatchId: null });
      }
    }
  }, [match, user, userProfile, firestore]);

  const handleLeaveOrDeleteMatch = async () => {
    if (!firestore ||!user || !match || match.status !== 'waiting') return;
    
    setIsActionLoading(true);
    
    const isCreator = user.uid === match.creatorId;
    const isJoiner = !isCreator;
  
    try {
        const matchRef = doc(firestore, 'matches', match.id);
        const userRef = doc(firestore, 'users', user.uid);

        if (isCreator && match.playerIds.length > 1) {
            toast({ title: "Cannot delete", description: "Another player has joined. You cannot delete this match.", variant: "destructive"});
            setIsActionLoading(false);
            return;
        }

        // Refund all players and delete match if creator is the only one
        if (isCreator && match.playerIds.length === 1) {
            await runTransaction(firestore, async (transaction) => {
                const refundTransactionRef = doc(collection(firestore, 'transactions'));
                transaction.set(refundTransactionRef, {
                    userId: user.uid,
                    type: 'refund',
                    amount: match.entryFee,
                    status: 'completed',
                    createdAt: Timestamp.now(),
                    relatedMatchId: match.id,
                    description: `Refund for deleted match ${match.id}`,
                });
                transaction.update(userRef, { activeMatchId: null });
                transaction.delete(matchRef);
            });
            toast({ title: 'Match Deleted', description: 'Your entry fee has been refunded.' });
            router.push('/lobby');
        } 
        // If a joiner leaves
        else if (isJoiner) {
            await runTransaction(firestore, async (transaction) => {
                const refundTransactionRef = doc(collection(firestore, 'transactions'));
                transaction.set(refundTransactionRef, {
                    userId: user.uid,
                    type: 'refund',
                    amount: match.entryFee,
                    status: 'completed',
                    createdAt: Timestamp.now(),
                    relatedMatchId: match.id,
                    description: `Refund for leaving match ${match.id}`,
                });

                const playerToRemove = match.players.find((p: any) => p.id === user.uid);
                transaction.update(matchRef, {
                    playerIds: arrayRemove(user.uid),
                    players: arrayRemove(playerToRemove),
                });
                transaction.update(userRef, { activeMatchId: null });
            });
            toast({ title: 'You have left the match', description: 'Your entry fee has been refunded.' });
            router.push('/lobby');
        }
    } catch (error: any) {
      console.error('Error leaving/deleting match:', error);
      toast({
        title: 'Error performing action',
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
  const isPlayer = user && match.playerIds.includes(user.uid);
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

          {(showRoomCodeStage || (match.status === 'in-progress' && isPlayer)) && <RoomCodeManager match={match} isCreator={isCreator} />}
          
          {showPlayAndSubmitStage && isPlayer && (
            <SubmitResultForm matchId={match.id} />
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
                 <Button className='mt-4' onClick={() => router.push('/lobby')}>Back to Lobby</Button>
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
            {match.status === 'waiting' && isPlayer && (
              <CardFooter>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLeaveOrDeleteMatch}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isCreator ? <Trash2 className="mr-2 h-4 w-4" /> : <LogOut className="mr-2 h-4 w-4" />)}
                    {isCreator ? 'Delete Match' : 'Leave Match'}
                  </Button>
              </CardFooter>
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
                  {match.creatorId === player.id && <Badge variant="outline">Creator</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
