
'use client';
import Image from "next/image";
import { SubmitResultForm } from "@/components/app/submit-result-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Crown, ShieldCheck, Swords, Users, Wallet, Loader2, Info, Trash2, LogOut, FileQuestion, Gamepad2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore, useUser } from "@/firebase";
import { doc, onSnapshot, runTransaction, collection, writeBatch, Timestamp, arrayRemove, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";


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
    const unsubscribe = onSnapshot(matchRef, (doc) => {
        if(doc.exists()) {
            setMatch({ id: doc.id, ...doc.data() } as Match);
        } else {
            console.error("Match not found!");
            setMatch(null);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching match:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, id]);

  const handleCopyRoomCode = () => {
    if (match?.roomCode) {
        navigator.clipboard.writeText(match.roomCode);
        toast({ title: "Room code copied!" });
    }
  };

  const handleDeleteMatch = async () => {
      if (!firestore || !user || !match || user.uid !== match.creatorId || match.status !== 'waiting') return;
      setIsActionLoading(true);
      try {
          const batch = writeBatch(firestore);
          const matchRef = doc(firestore, 'matches', match.id);

          // Refund all players
          for (const playerId of match.playerIds) {
              const userRef = doc(firestore, 'users', playerId);
              const transactionRef = doc(collection(firestore, 'transactions'));
              
              batch.update(userRef, { walletBalance: (match.players.find(p => p.id === playerId) as any)?.walletBalance + match.entryFee });
              
              batch.set(transactionRef, {
                  userId: playerId,
                  type: "refund",
                  amount: match.entryFee,
                  status: "completed",
                  createdAt: Timestamp.now(),
                  relatedMatchId: match.id,
                  description: `Refund for deleted match ${match.id}`
              });
          }

          batch.delete(matchRef);
          await batch.commit();
          
          toast({ title: "Match Deleted", description: "All players have been refunded." });
          router.push('/lobby');

      } catch (error: any) {
          toast({ title: "Error deleting match", description: error.message, variant: "destructive" });
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
            if (!userDoc.exists()) throw new Error("User not found");

            const newBalance = (userDoc.data().walletBalance || 0) + match.entryFee;
            transaction.update(userRef, { walletBalance: newBalance });

            const playerToRemove = match.players.find(p => p.id === user.uid);
            transaction.update(matchRef, {
                playerIds: arrayRemove(user.uid),
                players: arrayRemove(playerToRemove)
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
        toast({ title: "You have left the match", description: "Your entry fee has been refunded." });
        router.push('/lobby');

    } catch (error: any) {
        toast({ title: "Error leaving match", description: error.message, variant: "destructive" });
        setIsActionLoading(false);
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
  }

  if (!match) {
    return (
        <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Match Not Found</AlertTitle>
            <AlertDescription>The match you are looking for does not exist or has been removed.</AlertDescription>
        </Alert>
    );
  }

  const showSubmitForm = !match.winnerId || !match.prizeDistributed;
  const isCreator = user?.uid === match.creatorId;
  const isJoiner = user && match.playerIds.includes(user.uid) && !isCreator;


  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Match Details</h2>
        <div className={cn("text-lg font-semibold px-4 py-2 rounded-lg", {
            "bg-green-100 text-green-800": match.status === 'waiting',
            "bg-blue-100 text-blue-800": match.status === 'in-progress',
            "bg-gray-100 text-gray-800": match.status === 'completed',
            "bg-red-100 text-red-800": match.status === 'disputed',
        })}>
            Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2 space-y-8">
            {(match.status === 'in-progress' || (match.status === 'waiting' && match.playerIds.length === match.maxPlayers)) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-primary"/> Steps to Play
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">1</div>
                            <div>
                                <p className="font-semibold">Copy Room Code</p>
                                <p className="text-sm text-muted-foreground">The creator has provided a Ludo King room code. Click to copy it.</p>
                                <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg mt-2">
                                    <p className="text-lg font-mono tracking-widest font-bold text-primary">{match.roomCode || "Waiting for code..."}</p>
                                    <Button variant="ghost" size="icon" onClick={handleCopyRoomCode} disabled={!match.roomCode}>
                                        <Copy className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">2</div>
                            <div>
                                <p className="font-semibold">Join in Ludo King</p>
                                <p className="text-sm text-muted-foreground">Open Ludo King, select "Play with Friends", and join the room using the code.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">3</div>
                            <div>
                                <p className="font-semibold">Play & Win</p>
                                <p className="text-sm text-muted-foreground">After the match, take a screenshot of the results screen and submit it below.</p>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
            )}
           
            {showSubmitForm ? (
                <SubmitResultForm matchId={match.id} />
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Match Concluded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This match has been completed and winnings have been distributed. No further actions can be taken.</p>
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
                        <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4"/> Entry Fee</span>
                        <span className="font-semibold">₹{match.entryFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Crown className="h-4 w-4"/> Prize Pool</span>
                        <span className="font-semibold">₹{match.prizePool}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> Players</span>
                        <span className="font-semibold">{match.playerIds.length} / {match.maxPlayers}</span>
                    </div>
                </CardContent>
                 {match.status === 'waiting' && (
                    <CardContent>
                        {isCreator && (
                            <Button variant="destructive" className="w-full" onClick={handleDeleteMatch} disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Match
                            </Button>
                        )}
                        {isJoiner && (
                            <Button variant="destructive" className="w-full" onClick={handleLeaveMatch} disabled={isActionLoading}>
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
                    {match.players.map(player => (
                        <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={player.avatarUrl} />
                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{player.name}</p>
                                    <p className="text-sm text-muted-foreground">Win Rate: {player.winRate || 0}%</p>
                                </div>
                            </div>
                            <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1 text-green-500"/> Verified</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
