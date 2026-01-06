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

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const RANK_THRESHOLDS = [
    { rank: 0, name: 'Beginner', unlockRange: [50, 100], requiredWinning: 0 },
    { rank: 1, name: 'Learner', unlockRange: [150, 300], requiredWinning: 300 },
    { rank: 2, name: 'Skilled', unlockRange: [500, 1000], requiredWinning: 1500 },
    { rank: 3, name: 'Pro', unlockRange: [1500, 3000], requiredWinning: 5000 },
    { rank: 4, name: 'Elite', unlockRange: [5000, 10000], requiredWinning: 20000 },
    { rank: 5, name: 'Champion', unlockRange: [15000, 50000], requiredWinning: 50000 },
];

const getUserRank = (netWinning: number) => {
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
        if (netWinning >= RANK_THRESHOLDS[i].requiredWinning) {
            return RANK_THRESHOLDS[i];
        }
    }
    return RANK_THRESHOLDS[0];
};

const feeToRankMap = new Map<number, number>();
RANK_THRESHOLDS.forEach(r => {
    if(r.unlockRange.length === 2) {
        for(let fee = r.unlockRange[0]; fee <= r.unlockRange[1]; fee += (fee < 500 ? 50 : (fee < 5000 ? 500 : 5000))) {
            if(!feeToRankMap.has(fee)) feeToRankMap.set(fee, r.rank);
        }
    }
});


const PlayCard = ({ entryFee, onJoin }: { entryFee: number, onJoin: (fee: number) => void }) => {
    const { userProfile } = useUser();
    const [isJoining, setIsJoining] = useState(false);
    
    const prizePool = useMemo(() => entryFee * 1.8, [entryFee]);

    const userRank = useMemo(() => getUserRank(userProfile?.totalNetWinning || 0), [userProfile?.totalNetWinning]);
    const maxUnlockedAmount = userRank.unlockRange[1];
    
    const requiredRankForCard = useMemo(() => {
        for (const rank of RANK_THRESHOLDS) {
            if (entryFee >= rank.unlockRange[0] && entryFee <= rank.unlockRange[1]) {
                return rank;
            }
        }
        return RANK_THRESHOLDS[0];
    }, [entryFee]);

    const isLocked = userRank.rank < requiredRankForCard.rank;

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

    const lockedTooltip = `Win ₹${requiredRankForCard.requiredWinning - (userProfile?.totalNetWinning || 0)} more to unlock this tier.`;

    const cardContent = (
        <Card className={cn(
            "w-full shadow-lg border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300",
            isLocked ? "bg-muted/50 border-dashed" : `bg-gradient-to-br ${getTierColor(entryFee)}`,
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const entryFees = useMemo(() => {
    const fees = new Set<number>();
    // Tier 1
    for (let i = 50; i <= 500; i += 50) fees.add(i);
    // Tier 2
    for (let i = 500; i <= 5000; i += 500) fees.add(i);
    // Tier 3
    for (let i = 5000; i <= 50000; i += 5000) fees.add(i);
    return Array.from(fees).sort((a,b) => a-b);
  }, []);

  const handleJoinMatch = async (entryFee: number) => {
     if (!user || !firestore) {
         toast({ title: "You must be logged in.", variant: "destructive" });
         return;
     }

     // Here you would call a cloud function to find an opponent and create/join a match.
     // For now, we simulate a successful join and link to a placeholder match.
     toast({ title: `Searching for a ₹${entryFee} match...`});
     // This is where you would call: const { data } = await functions.findOpponentAndCreateMatch({ entryFee });
     // And then router.push(`/match/${data.matchId}`);
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
