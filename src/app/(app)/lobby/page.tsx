'use client';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Swords, Users, Star, History, Loader2, Info, Lock } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, runTransaction, Timestamp, arrayRemove } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { CreateMatchDialog } from "@/components/app/create-match-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const RANK_THRESHOLDS = [
    { rank: 0, name: 'Beginner', maxAmount: 100, requiredWinning: 300 },
    { rank: 1, name: 'Learner', maxAmount: 300, requiredWinning: 1500 },
    { rank: 2, name: 'Skilled', maxAmount: 1000, requiredWinning: 5000 },
    { rank: 3, name: 'Pro', maxAmount: 3000, requiredWinning: 20000 },
    { rank: 4, name: 'Elite', maxAmount: 10000, requiredWinning: 50000 },
    { rank: 5, name: 'Champion', maxAmount: 50000, requiredWinning: Infinity },
];

const PlayCard = ({ entryFee, onJoin }: { entryFee: number, onJoin: (fee: number) => void }) => {
    const { userProfile } = useUser();
    const [isJoining, setIsJoining] = useState(false);
    
    const prizePool = useMemo(() => entryFee * 1.8, [entryFee]);
    
    const maxUnlockedAmount = userProfile?.maxUnlockedAmount ?? 0;
    const isLocked = entryFee > maxUnlockedAmount;

    const nextRankInfo = RANK_THRESHOLDS.find(r => entryFee <= r.maxAmount);
    const requiredWinning = nextRankInfo?.requiredWinning ?? 0;
    const currentWinning = userProfile?.totalNetWinning ?? 0;
    const neededForUnlock = requiredWinning - currentWinning;

    const lockedTooltip = `Win ₹${neededForUnlock.toLocaleString()} more to unlock this tier.`;

    const handleJoin = async () => {
        setIsJoining(true);
        await onJoin(entryFee);
        setIsJoining(false);
    };

    const getTierColor = (fee: number) => {
        if (fee <= 300) return 'from-amber-800/20 to-amber-600/20 border-amber-700/50'; // Bronze
        if (fee <= 1000) return 'from-slate-600/20 to-slate-400/20 border-slate-500/50'; // Silver
        if (fee <= 10000) return 'from-yellow-600/20 to-yellow-400/20 border-yellow-500/50'; // Gold
        return 'from-purple-600/20 to-purple-400/20 border-purple-500/50'; // Champion
    };


    const cardContent = (
        <Card className={cn(
            "w-full shadow-lg border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300",
            isLocked ? "bg-muted/50 border-dashed filter grayscale" : `bg-gradient-to-br ${getTierColor(entryFee)}`,
        )}>
            <CardHeader className="p-4 text-center">
                <CardDescription className={cn("font-semibold", isLocked ? "text-muted-foreground" : "text-amber-300")}>Prize Pool</CardDescription>
                <CardTitle className={cn("text-3xl font-bold tracking-tighter", isLocked ? "text-muted-foreground" : "text-white")}>
                    ₹{prizePool.toLocaleString('en-IN')}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Button 
                    className="w-full font-bold text-lg h-12" 
                    variant={isLocked ? "secondary" : "default"}
                    disabled={isLocked || isJoining}
                    onClick={handleJoin}>
                    {isJoining ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                        isLocked ? <Lock className="h-5 w-5"/> : `Play for ₹${entryFee}`
                    )}
                </Button>
            </CardContent>
        </Card>
    );

    if (isLocked) {
        return (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <div className="relative cursor-not-allowed">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{lockedTooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return cardContent;
};


export default function LobbyPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const entryFees = useMemo(() => {
    const fees = new Set<number>();
    // Tier 1
    for (let i = 50; i <= 500; i += 50) fees.add(i);
    // Tier 2
    for (let i = 600; i <= 5000; i += 500) fees.add(i);
    // Tier 3
    for (let i = 6000; i <= 50000; i += 5000) fees.add(i);
    return Array.from(fees).sort((a,b) => a-b);
  }, []);

  const handleJoinMatch = async (entryFee: number) => {
     if (!user || !firestore || !userProfile) {
         toast({ title: "You must be logged in.", variant: "destructive" });
         return;
     }

    const functions = getFunctions();
    const findOpponent = httpsCallable(functions, 'findOpponentAndCreateMatch');

    toast({ title: `Searching for a ₹${entryFee} match...`, description: "Please wait while we find you an opponent."});

    try {
        const { data }: any = await findOpponent({ entryFee });
        if(data.matchId) {
            toast({ title: "Match Found!", description: `Joining match ${data.matchId}`});
            router.push(`/match/${data.matchId}`);
        } else {
             throw new Error("Could not find or create a match.");
        }
    } catch(error: any) {
        console.error(error);
        toast({ title: "Matchmaking Failed", description: error.message || "Could not join the match. Please try again.", variant: "destructive"});
    }
  }

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
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {entryFees.map(fee => <PlayCard key={fee} entryFee={fee} onJoin={handleJoinMatch} />)}
      </div>
    </div>
  );
}
