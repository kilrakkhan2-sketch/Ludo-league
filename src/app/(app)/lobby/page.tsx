
'use client';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Swords, Users, Star, History, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, runTransaction, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CreateMatchDialog } from "@/components/app/create-match-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const MatchCard = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinMatch = async () => {
        if (!user || !firestore) {
            toast({ title: "You must be logged in to join.", variant: "destructive"});
            return;
        }
        setIsJoining(true);
        try {
            const matchRef = doc(firestore, "matches", match.id);
            const userRef = doc(firestore, "users", user.uid);
            
            await runTransaction(firestore, async (transaction) => {
                const matchDoc = await transaction.get(matchRef);
                const userDoc = await transaction.get(userRef);

                if (!matchDoc.exists() || !userDoc.exists()) {
                    throw new Error("Match or user not found!");
                }

                const matchData = matchDoc.data();
                const userData = userDoc.data();
                
                if ((userData.walletBalance || 0) < matchData.entryFee) {
                    throw new Error("Insufficient wallet balance.");
                }

                if (matchData.playerIds.length >= matchData.maxPlayers) {
                    throw new Error("Match is already full.");
                }
                
                if (matchData.playerIds.includes(user.uid)) {
                    // This case should ideally not happen if UI is correct, but as a safeguard.
                    return;
                }
                
                const newBalance = (userData.walletBalance || 0) - matchData.entryFee;
                
                transaction.update(userRef, { walletBalance: newBalance });
                transaction.update(matchRef, { 
                    playerIds: arrayUnion(user.uid),
                    players: arrayUnion({
                        id: user.uid,
                        name: user.displayName,
                        avatarUrl: user.photoURL,
                    })
                });

                const transactionRef = doc(collection(firestore, "transactions"));
                transaction.set(transactionRef, {
                    userId: user.uid,
                    type: "entry-fee",
                    amount: -matchData.entryFee,
                    status: "completed",
                    createdAt: Timestamp.now(),
                    relatedMatchId: match.id,
                    description: `Entry fee for match ${match.id}`
                });

            });

            toast({ title: "Successfully joined match!" });

        } catch (error: any) {
            console.error("Error joining match:", error);
            toast({
                title: "Failed to join match",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsJoining(false);
        }
    };
    
    const canJoin = match.status === 'waiting' && !match.playerIds.includes(user?.uid || '');
    const canView = match.playerIds.includes(user?.uid || '');

    return (
    <Card key={match.id} className="w-full shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center p-4">
            <div className="flex-grow">
                <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Swords className="h-5 w-5 text-primary" />
                        <span>Prize: ₹{match.prizePool}</span>
                    </CardTitle>
                    <CardDescription className="pt-1">Entry: ₹{match.entryFee}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center -space-x-3">
                             {match.players.slice(0, 2).map((player) => (
                            <Avatar key={player.id} className={`h-8 w-8 border-2 border-background`}>
                                <AvatarImage src={player.avatarUrl} alt={player.name} />
                                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            ))}
                            {match.players.length > 2 && (
                                <Avatar className="h-8 w-8 border-2 border-background bg-muted-foreground/20">
                                    <AvatarFallback>+{match.players.length - 2}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{match.playerIds.length}/{match.maxPlayers}</span>
                        </div>
                    </div>
                </CardContent>
            </div>
            <div className="flex flex-col items-center gap-2">
                 <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", {
                    "bg-green-100 text-green-800": match.status === 'waiting',
                    "bg-blue-100 text-blue-800": match.status === 'in-progress',
                    "bg-gray-100 text-gray-800": match.status === 'completed',
                    "bg-red-100 text-red-800": match.status === 'disputed',
                })}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                </div>
                 {canView ? (
                    <Button asChild className="w-full h-9" variant="outline">
                        <Link href={`/match/${match.id}`}>
                            View
                        </Link>
                    </Button>
                 ) : (
                    <Button onClick={handleJoinMatch} className="w-full h-9" variant="default" disabled={!canJoin || isJoining}>
                        {isJoining ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Join'}
                    </Button>
                 )}
            </div>
        </div>
    </Card>
    );
};


export default function LobbyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [openMatches, setOpenMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user) return;

    setLoading(true);

    const matchesRef = collection(firestore, "matches");
    
    // My Matches
    const myMatchesQuery = query(matchesRef, where("playerIds", "array-contains", user.uid));
    const unsubscribeMyMatches = onSnapshot(myMatchesQuery, (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
        setMyMatches(matchesData);
        setLoading(false);
    });

    // Open Matches (that I am not in)
    const openMatchesQuery = query(matchesRef, where("status", "==", "waiting"));
     const unsubscribeOpenMatches = onSnapshot(openMatchesQuery, (snapshot) => {
        const matchesData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Match))
            .filter(match => !match.playerIds.includes(user.uid));
        setOpenMatches(matchesData);
        setLoading(false);
    });

    return () => {
        unsubscribeMyMatches();
        unsubscribeOpenMatches();
    }
  }, [firestore, user]);


  return (
    <div className="space-y-6">
        {bannerImage && (
             <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden">
                <Image src={bannerImage.imageUrl} alt="Lobby Banner" fill className="object-cover" data-ai-hint={bannerImage.imageHint}/>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                        <Swords className="h-8 w-8" /> Match Lobby
                    </h2>
                </div>
            </div>
        )}
      <div className="flex items-center justify-end space-x-2">
          <CreateMatchDialog />
      </div>
      <div className="flex flex-col gap-8">
        
        {myMatches.length > 0 && (
            <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-400"/> My Matches
                </h3>
                <div className="flex flex-col gap-4">
                    {myMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            </section>
        )}

        <section>
            <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                <Swords className="h-6 w-6 text-primary"/> Open Matches
            </h3>
            {loading ? (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                 </div>
            ) : openMatches.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {openMatches.map((match) => (
                       <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            ) : (
                <Card className="flex items-center justify-center p-8 border-dashed shadow-md">
                    <p className="text-muted-foreground">No open matches available. Why not create one?</p>
                </Card>
            )}
        </section>
      </div>
    </div>
  );
}
