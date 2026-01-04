'use client';
import Image from "next/image";
import { SubmitResultForm } from "@/components/app/submit-result-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Crown, ShieldCheck, Swords, Users, Wallet, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";


export default function MatchPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore || !params.id) return;
    setLoading(true);
    const matchRef = doc(firestore, 'matches', params.id);
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
  }, [firestore, params.id]);

  const handleCopyRoomCode = () => {
    if (match?.roomCode) {
        navigator.clipboard.writeText(match.roomCode);
        toast({ title: "Room code copied!" });
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
            {match.status === 'in-progress' && match.roomCode && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-primary"/> Ludo King Room Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                        <p className="text-2xl font-mono tracking-widest font-bold text-primary">{match.roomCode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopyRoomCode}>
                            <Copy className="h-5 w-5 text-muted-foreground" />
                        </Button>
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
