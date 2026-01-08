
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
  Trophy
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
  arrayUnion,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Match, Player, MatchResult } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OpenLudoKingButton from '@/components/app/OpenLudoKingButton';


const PlayerLobby = ({ match, winnerId }: { match: Match, winnerId: string | null }) => {
    const player1 = match.players[0];
    const player2 = match.players.length > 1 ? match.players[1] : null;
    
    const PlayerAvatar = ({ player, isWinner }: { player: Player, isWinner: boolean }) => (
        <div className="flex flex-col items-center gap-2 relative">
            {isWinner && (
                <Trophy className="absolute -top-6 h-10 w-10 text-amber-400 drop-shadow-lg" />
            )}
            <Avatar className={cn(
                "h-24 w-24 border-4 shadow-lg",
                isWinner ? "border-amber-400" : "border-muted"
            )}>
                <AvatarImage src={player.avatarUrl} alt={player.name} />
                <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg text-center truncate max-w-[150px]">{player.name}</h3>
            <p className="text-sm text-muted-foreground">Win Rate: {player.winRate || 0}%</p>
        </div>
    );

    return (
        <Card className="w-full bg-card shadow-lg border-2 border-primary/20">
            <CardContent className="p-6">
                <div className="flex items-center justify-around">
                    {player1 && <PlayerAvatar player={player1} isWinner={winnerId === player1.id} />}
                    
                    <div className="text-4xl font-black text-muted-foreground/50 mx-4">VS</div>

                    {player2 ? (
                        <PlayerAvatar player={player2} isWinner={winnerId === player2.id} />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                             <Avatar className="h-24 w-24 border-4 border-dashed flex items-center justify-center bg-muted/50">
                                <Loader2 className="h-8 w-8 animate-spin"/>
                            </Avatar>
                            <h3 className="font-semibold text-lg">Waiting...</h3>
                            <p className="text-sm">For Opponent</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MatchDetailsCard = ({ match }: { match: Match }) => (
    <div className="w-full text-center rounded-xl bg-gradient-to-tr from-primary via-primary-dark to-primary-start p-6 shadow-2xl">
        <div className="flex justify-around items-center">
            <div className="text-primary-foreground">
                <p className="text-sm font-semibold opacity-80 uppercase tracking-wider flex items-center gap-2"><Wallet className="h-4 w-4"/> Entry Fee</p>
                <p className="text-3xl font-bold">₹{match.entryFee.toLocaleString()}</p>
            </div>
            <div className="h-16 w-px bg-white/20"></div>
            <div className="text-primary-foreground">
                <p className="text-sm font-semibold opacity-80 uppercase tracking-wider flex items-center gap-2"><Trophy className="h-4 w-4"/> Prize Pool</p>
                <p className="text-3xl font-bold">₹{match.prizePool.toLocaleString()}</p>
            </div>
        </div>
    </div>
);

const JoinMatchButton = ({ match, user, userProfile, isActionLoading, handleJoinMatch }: any) => {
    const hasSufficientBalance = userProfile && userProfile.walletBalance >= match.entryFee;
    const isAlreadyInMatch = userProfile && userProfile.activeMatchId && userProfile.activeMatchId !== match.id;

    if (isAlreadyInMatch) {
        return (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>You are already in another match. Please complete or leave it before joining a new one.</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Join This Match</CardTitle>
                <CardDescription>Click the button below to join the match. The entry fee will be deducted from your wallet.</CardDescription>
            </CardHeader>
            <CardContent>
                {!hasSufficientBalance && (
                     <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Insufficient Balance</AlertTitle>
                        <AlertDescription>
                            You do not have enough funds to join this match. 
                            <Button variant="link" className="p-0 h-auto ml-1" asChild><a href="/wallet">Add funds?</a></Button>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                 <Button size="lg" className="w-full font-bold text-lg" onClick={handleJoinMatch} disabled={isActionLoading || !hasSufficientBalance || isAlreadyInMatch}>
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Swords className="mr-2 h-4 w-4"/>}
                    Join Match (₹{match.entryFee})
                </Button>
            </CardFooter>
        </Card>
    );
}

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
      toast({ title: 'Invalid Room Code', description: 'Room code must be exactly 8 digits.', variant: 'destructive' });
      return;
    }
    if (!firestore) return;
    
    setIsSubmitting(true);
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      await updateDoc(matchRef, { roomCode: roomCode, status: 'in-progress' });
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

  if (isCreator && !match.roomCode && match.playerIds.length === match.maxPlayers && match.status === 'waiting') {
    return (
      <Card>
        <CardHeader><CardTitle>Enter Room Code</CardTitle><CardDescription>The match is full. Create a room in Ludo King and enter the code below.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="room-code">Ludo King Room Code</Label>
          <Input id="room-code" value={roomCode} onChange={handleRoomCodeChange} placeholder="8-digit code" type="text" inputMode="numeric" maxLength={8} pattern="\d{8}"/>
        </CardContent>
        <CardFooter><Button onClick={handleSubmitRoomCode} disabled={isSubmitting} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit & Start</Button></CardFooter>
      </Card>
    );
  }

  if (!isCreator && !match.roomCode && match.playerIds.length === match.maxPlayers && match.status === 'waiting') {
     return (
      <Card>
        <CardHeader><CardTitle>Waiting for Room Code</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center gap-3 text-muted-foreground p-8"><Loader2 className="h-6 w-6 animate-spin"/><p className="font-semibold">The creator is generating the room code...</p></CardContent>
      </Card>
    );
  }

  if (match.roomCode) {
    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-primary"/> Play Now!</CardTitle><CardDescription>Use the room code to join the match in your Ludo King app.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Ludo King Room Code</Label>
                    <div className="flex items-center justify-between bg-gradient-to-r from-primary-start to-primary-end text-primary-foreground p-3 rounded-lg mt-1 shadow-md">
                        <p className="text-2xl font-mono tracking-widest font-bold">{match.roomCode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopyRoomCode} className='hover:bg-white/20'><Copy className="h-5 w-5" /></Button>
                    </div>
                </div>
                <OpenLudoKingButton />
            </CardContent>
        </Card>
    )
  }
  return null;
};

const MatchRules = () => (
    <Card>
      <CardHeader><CardTitle>Match Rules</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>1. Players must use the provided Ludo King room code.</p>
        <p>2. After the match, the winner must upload a screenshot of the win.</p>
        <p>3. Any disputes will be reviewed by an admin.</p>
      </CardContent>
    </Card>
);

const MatchIdCard = ({ id }: {id: string}) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(id);
        toast({ title: 'Match ID copied!' });
    }
    return (
        <Card>
            <CardHeader><CardTitle>Match ID</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <p className="text-sm font-mono text-muted-foreground">{id}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

const MatchConcludedCard = ({ match }: {match: Match}) => {
    const router = useRouter();
    let title = "Match Concluded";
    let description = "This match has finished. Winnings are being processed or are already distributed.";

    if (match.status === 'disputed') {
        title = "Match Disputed";
        description = "There was a conflict in the submitted results. An admin is reviewing the match. Please be patient."
    } else if (match.status === 'cancelled') {
        title = "Match Cancelled";
        description = "This match was cancelled. Any entry fees have been refunded."
    }

    return (
         <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/> {title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className='w-full' onClick={() => router.push('/lobby')}>Back to Lobby</Button>
            </CardFooter>
        </Card>
    )
}

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
    const unsubscribe = onSnapshot(matchRef, (doc) => {
        if (doc.exists()) setMatch({ id: doc.id, ...doc.data() } as Match);
        else {
          toast({ title: "Match not found", variant: "destructive" });
          router.push('/lobby');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching match:', error);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [firestore, id, router, toast]);
  
  useEffect(() => {
    if (user && userProfile && match && ['cancelled', 'completed', 'disputed'].includes(match.status)) {
      if (userProfile.activeMatchId === match.id) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDoc(userRef, { activeMatchId: null });
      }
    }
  }, [match, user, userProfile, firestore]);


  const handleJoinMatch = async () => {
    if (!firestore || !user || !match || !userProfile || match.status !== 'waiting') return;

    setIsActionLoading(true);
    try {
      await runTransaction(firestore, async (transaction) => {
        const matchRef = doc(firestore, 'matches', match.id);
        const userRef = doc(firestore, 'users', user.uid);

        const matchDoc = await transaction.get(matchRef);
        const userDoc = await transaction.get(userRef);
        if (!matchDoc.exists() || !userDoc.exists()) throw new Error("Match or user not found");
        
        const currentMatch = matchDoc.data() as Match;
        const currentUser = userDoc.data();

        if (currentUser.walletBalance < currentMatch.entryFee) throw new Error("Insufficient funds");
        if (currentMatch.playerIds.includes(user.uid)) throw new Error("You are already in this match");
        if (currentMatch.playerIds.length >= currentMatch.maxPlayers) throw new Error("Match is full");
        if (currentUser.activeMatchId) throw new Error("You are already in an active match.");

        const newPlayer: Player = { id: user.uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl, winRate: userProfile.winRate };
        transaction.update(matchRef, { playerIds: arrayUnion(user.uid), players: arrayUnion(newPlayer) });
        transaction.update(userRef, { activeMatchId: match.id });
      });
      toast({ title: "Successfully Joined!", description: "You have been added to the match." });
    } catch (error: any) {
      console.error('Error joining match:', error);
      toast({ title: 'Error Joining Match', description: error.message, variant: 'destructive' });
    } finally {
      setIsActionLoading(false);
    }
  };

   const handleLeaveOrDeleteMatch = async () => {
    if (!firestore ||!user || !match || match.status !== 'waiting') return;
    setIsActionLoading(true);
    const isCreator = user.uid === match.creatorId;

    try {
        await runTransaction(firestore, async (transaction) => {
            const matchRef = doc(firestore, 'matches', match.id);
            const userRef = doc(firestore, 'users', user.uid);

            const matchDoc = await transaction.get(matchRef);
            if (!matchDoc.exists()) throw new Error("Match not found");

            const refundTransactionRef = doc(collection(firestore, 'transactions'));
            transaction.set(refundTransactionRef, {
                userId: user.uid, type: 'refund', amount: match.entryFee, status: 'completed', createdAt: Timestamp.now(),
                relatedMatchId: match.id, description: `Refund for leaving/deleting match ${match.id}`,
            });
            transaction.update(userRef, { activeMatchId: null });

            if (isCreator) {
                 if (match.playerIds.length > 1) throw new Error("Cannot delete a match another player has joined.");
                 transaction.delete(matchRef);
            } else {
                const playerToRemove = match.players.find((p: any) => p.id === user.uid);
                transaction.update(matchRef, { playerIds: arrayRemove(user.uid), players: arrayRemove(playerToRemove) });
            }
        });

        toast({ title: isCreator ? 'Match Deleted' : 'You Left the Match', description: 'Your entry fee has been refunded.' });
        router.push('/lobby');
    } catch (error: any) {
      console.error('Error leaving/deleting match:', error);
      toast({ title: 'Error performing action', description: error.message, variant: 'destructive' });
      setIsActionLoading(false);
    }
  };

  if (loading || !user || !userProfile) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!match) {
    return <Alert variant="destructive"><Info className="h-4 w-4" /><AlertTitle>Match Not Found</AlertTitle><AlertDescription>The match may have been removed.</AlertDescription></Alert>;
  }
  
  const isCreator = user.uid === match.creatorId;
  const isPlayer = match.playerIds.includes(user.uid);
  const isMatchFull = match.playerIds.length === match.maxPlayers;
  const winnerId = match.result?.winnerId || null;

  const showJoinButton = match.status === 'waiting' && !isPlayer && !isMatchFull;
  const showRoomCodeStage = (match.status === 'waiting' && isMatchFull) || (match.status === 'in-progress' && isPlayer);
  const showPlayAndSubmitStage = match.status === 'in-progress' && !!match.roomCode && isPlayer;
  const showMatchConcluded = ['completed', 'disputed', 'cancelled'].includes(match.status);

  const ActionArea = () => {
      if (showJoinButton) return <JoinMatchButton {...{match, user, userProfile, isActionLoading, handleJoinMatch}} />;
      if (showRoomCodeStage) return <RoomCodeManager match={match} isCreator={isCreator} />;
      if (showPlayAndSubmitStage) return <SubmitResultForm matchId={match.id} winnerId={winnerId} />; // Pass winnerId here
      if (showMatchConcluded) return <MatchConcludedCard match={match} />
      return null; 
  }

  return (
    <div className="container mx-auto max-w-4xl py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content: Player Lobby & Actions */}
            <div className="md:col-span-2 space-y-6">
                <MatchDetailsCard match={match} />
                <PlayerLobby match={match} winnerId={winnerId} /> 
                <ActionArea />
            </div>

            {/* Sidebar: Match Info, Rules, etc. */}
            <div className="space-y-6">
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle>Match Status</CardTitle>
                        <Badge variant={match.status === 'disputed' ? 'destructive' : 'secondary'}>{match.status}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {isMatchFull ? 'Match is full and ready to start.' : `Waiting for ${match.maxPlayers - match.playerIds.length} more player(s).`}
                        </p>
                    </CardContent>
                     {match.status === 'waiting' && isPlayer && (
                        <CardFooter>
                            <Button
                                variant="outline"
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
                <MatchRules />
                <MatchIdCard id={id}/>
            </div>
        </div>
    </div>
  );
}
