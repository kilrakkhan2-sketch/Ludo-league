'use client';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Swords, Users, Star, History, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, runTransaction, Timestamp, arrayRemove } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CreateMatchDialog } from "@/components/app/create-match-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const VersusLogo = () => (
    <div className="relative h-10 w-10 flex items-center justify-center">
        <div className="absolute h-full w-full bg-gradient-to-br from-primary-start to-primary-end rounded-full opacity-30 blur-sm"></div>
        <span className="relative text-xl font-black text-white" style={{ textShadow: '0 0 5px hsl(var(--primary))' }}>VS</span>
    </div>
);

const MatchCard = ({ match, canJoinMatch }: { match: Match; canJoinMatch: boolean }) => {
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
                    return;
                }
                
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
    
    const canJoin = match.status === 'waiting' && !match.playerIds.includes(user?.uid || '') && canJoinMatch;
    const canView = match.playerIds.includes(user?.uid || '');

    const creator = match.players[0];
    const opponent = match.players.length > 1 ? match.players[1] : null;

    return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
    <Card key={match.id} className="w-full shadow-lg border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-primary/20">
        <CardHeader className="p-4 bg-gradient-to-b from-muted/50 to-transparent">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-lg">
                    <Swords className="h-5 w-5 text-primary" />
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-start to-primary-end">Prize: ₹{match.prizePool}</span>
                </div>
                <div className={cn("text-xs font-bold px-2.5 py-1 rounded-full", {
                    "bg-green-100 text-green-800 border border-green-300": match.status === 'waiting',
                    "bg-blue-100 text-blue-800 border border-blue-300": match.status === 'in-progress',
                    "bg-gray-100 text-gray-800 border border-gray-300": match.status === 'completed',
                    "bg-red-100 text-red-800 border border-red-300": match.status === 'disputed',
                })}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                </div>
            </div>
            <CardDescription className="pt-1 !mt-1">Entry: ₹{match.entryFee}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
            <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-2 text-center">
                    <Avatar className={`h-16 w-16 border-4 border-primary/50`}>
                        <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                        <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm truncate max-w-[100px]">{creator.name}</span>
                </div>

                <VersusLogo />

                 <div className="flex flex-col items-center gap-2 text-center">
                    {opponent ? (
                        <>
                        <Avatar className={`h-16 w-16 border-4 border-muted`}>
                            <AvatarImage src={opponent.avatarUrl} alt={opponent.name} />
                            <AvatarFallback>{opponent.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm truncate max-w-[100px]">{opponent.name}</span>
                        </>
                    ) : (
                         <>
                        <Avatar className={`h-16 w-16 border-4 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/50`}>
                            <p className="text-2xl font-bold text-muted-foreground">?</p>
                        </Avatar>
                        <span className="font-semibold text-sm text-muted-foreground">Waiting...</span>
                        </>
                    )}
                </div>
            </div>
        </CardContent>
        <CardFooter className='p-4 bg-muted/20'>
             {canView ? (
                <Button asChild className="w-full h-10 text-base" variant="outline">
                    <Link href={`/match/${match.id}`}>
                        View Match
                    </Link>
                </Button>
             ) : (
                <Button onClick={handleJoinMatch} className="w-full h-10 text-base" variant="default" disabled={!canJoin || isJoining}>
                    {isJoining ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Join Now'}
                </Button>
             )}
        </CardFooter>
    </Card>
    </motion.div>
    );
};


export default function LobbyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [openMatches, setOpenMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMatchCount, setActiveMatchCount] = useState(0);

  useEffect(() => {
    if (!firestore || !user) return;

    setLoading(true);

    const matchesRef = collection(firestore, "matches");
    
    const allUserMatchesQuery = query(
        matchesRef,
        where("playerIds", "array-contains", user.uid)
    );
    const unsubscribeAllUserMatches = onSnapshot(allUserMatchesQuery, (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
        const activeMatches = matchesData.filter(m => m.status === 'waiting' || m.status === 'in-progress');
        setActiveMatchCount(activeMatches.length);
        setMyMatches(matchesData);
        setLoading(false);
    });

    const openMatchesQuery = query(matchesRef, where("status", "==", "waiting"));
     const unsubscribeOpenMatches = onSnapshot(openMatchesQuery, (snapshot) => {
        const matchesData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Match))
            .filter(match => !match.playerIds.includes(user.uid));
        setOpenMatches(matchesData);
        setLoading(false);
    });

    return () => {
        unsubscribeAllUserMatches();
        unsubscribeOpenMatches();
    }
  }, [firestore, user]);

  const canCreateOrJoin = activeMatchCount < 3;


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
          <CreateMatchDialog canCreate={canCreateOrJoin} />
      </div>

       {!canCreateOrJoin && (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Active Match Limit Reached</AlertTitle>
                <AlertDescription>You can have a maximum of 3 active matches (waiting or in-progress). Complete an existing match to create or join a new one.</AlertDescription>
            </Alert>
        )}

      <div className="flex flex-col gap-8">
        
        {myMatches.length > 0 && (
            <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-400"/> My Matches
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {myMatches.map((match) => (
                        <MatchCard key={match.id} match={match} canJoinMatch={canCreateOrJoin} />
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
                <div className="grid md:grid-cols-2 gap-6">
                    {openMatches.map((match) => (
                       <MatchCard key={match.id} match={match} canJoinMatch={canCreateOrJoin} />
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center p-8 border-dashed shadow-md bg-muted/30">
                    <p className="text-muted-foreground font-semibold text-lg">No open matches available.</p>
                    <p className="text-muted-foreground text-sm mt-1">Why not create one and start a new game?</p>
                </Card>
            )}
        </section>
      </div>
    </div>
  );
}
