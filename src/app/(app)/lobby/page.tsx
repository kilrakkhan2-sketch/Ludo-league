'use client';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Loader2, Info, Lock } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const EntryFeeCard = ({ 
    fee, 
    onPlay,
    isLocked = false,
}: { 
    fee: number; 
    onPlay: (fee: number) => void;
    isLocked: boolean;
}) => {
    
    const cardContent = (
      <Card className={cn(
          "flex flex-col h-full text-center bg-card/80 backdrop-blur-sm border-primary/20 transition-all duration-300",
          isLocked 
          ? "bg-muted/50 border-muted-foreground/20 cursor-not-allowed"
          : "hover:border-primary hover:-translate-y-1"
      )}>
        <CardHeader className="p-4 relative">
          {isLocked && <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />}
          <CardTitle className={cn(
              "text-2xl font-bold",
              isLocked ? "text-muted-foreground/50" : "text-transparent bg-clip-text bg-gradient-to-r from-primary-start to-primary-end"
          )}>
            ₹{fee}
          </CardTitle>
          <CardDescription className={cn(isLocked && "text-muted-foreground/50")}>Entry Fee</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <p className={cn("text-md font-semibold", isLocked ? "text-muted-foreground/50" : "")}>
            Prize: <span className={cn(isLocked ? "text-muted-foreground/50" : "text-green-500")}>₹{(fee * 1.8).toFixed(2)}</span>
          </p>
        </CardContent>
        <CardFooter className="p-4">
          <Button className="w-full h-9 text-sm" onClick={() => onPlay(fee)} disabled={isLocked}>
            {isLocked ? "Locked" : <><Swords className="mr-2 h-4 w-4" /> Play</>}
          </Button>
        </CardFooter>
      </Card>
    );

  if (isLocked) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
                <TooltipContent>
                    <p>Win more matches to unlock this tier.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  return cardContent;
};

const SearchingOverlay = ({ onCancel }: { onCancel: () => void }) => (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl font-bold text-primary">Searching for Opponent...</h2>
        <div className="flex items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            <p className="text-lg text-muted-foreground">Please wait while we find a match for you.</p>
        </div>
        <Button variant="outline" className="mt-8" onClick={onCancel}>Cancel Search</Button>
    </div>
);


export default function LobbyPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSearching, setIsSearching] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(0);

  // Listen for active match on user profile
  useEffect(() => {
    if (userProfile && userProfile.activeMatchId) {
        if (isSearching) {
            toast({ title: "Match Found!", description: "Redirecting you to the match room..." });
            router.push(`/match/${userProfile.activeMatchId}`);
        }
        setActiveMatchId(userProfile.activeMatchId);
    } else {
        setActiveMatchId(null);
    }
  }, [userProfile, isSearching, router, toast]);

  const handlePlayClick = (fee: number) => {
    if (!user || !userProfile) {
        toast({ title: "Please login to play.", variant: "destructive" });
        return;
    }
    if ((userProfile as any).isBlocked) {
        toast({ title: "Your account is blocked.", variant: "destructive" });
        return;
    }
    if (activeMatchId) {
        toast({ title: "You are already in an active match.", description: "Complete your current match to play another.", variant: "destructive" });
        router.push(`/match/${activeMatchId}`);
        return;
    }
     if (userProfile.walletBalance < fee) {
        toast({ title: "Insufficient Balance", description: `You need at least ₹${fee} to play.`, variant: "destructive" });
        return;
    }
    setSelectedFee(fee);
    setShowConfirmDialog(true);
  };
  
  const handleConfirmPlay = async () => {
    if (!user || !firestore || !userProfile) return;

    setShowConfirmDialog(false);
    setIsSearching(true);
    
    try {
        const queueRef = doc(firestore, 'matchmakingQueue', user.uid);
        await setDoc(queueRef, {
            userId: user.uid,
            entryFee: selectedFee,
            status: 'waiting',
            userName: user.displayName,
            userAvatar: user.photoURL,
            winRate: userProfile.winRate || 0,
            rank: userProfile.rank || 0,
            createdAt: new Date(),
        });
        toast({ title: "Searching for a match..." });
    } catch (error: any) {
        console.error("Error entering matchmaking queue: ", error);
        toast({ title: "Could not start search", description: error.message, variant: "destructive" });
        setIsSearching(false);
    }
  };

  const handleCancelSearch = async () => {
    if (!user || !firestore) return;
    setIsSearching(false);
    try {
        const queueRef = doc(firestore, 'matchmakingQueue', user.uid);
        await deleteDoc(queueRef);
        toast({ title: "Search Cancelled", description: "You have been removed from the matchmaking queue." });
    } catch (error: any) {
        console.error("Error cancelling search: ", error);
        toast({ title: "Could not cancel search", description: error.message, variant: "destructive" });
    }
  };

  const lowStakes = Array.from({ length: 10 }, (_, i) => 50 + i * 50);
  const mediumStakes = Array.from({ length: 9 }, (_, i) => 1000 + i * 500);
  const highStakes = Array.from({ length: 9 }, (_, i) => 10000 + i * 5000);

  const maxUnlockedAmount = userProfile?.maxUnlockedAmount ?? 0;

  const FeeTier = ({ fees }: { fees: number[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {fees.map(fee => {
        const isLocked = fee > maxUnlockedAmount;
        return (
          <EntryFeeCard 
            key={fee} 
            fee={fee} 
            onPlay={handlePlayClick} 
            isLocked={isLocked}
          />
        )
      })}
    </div>
  );

  return (
    <div className="space-y-6">
        {isSearching && <SearchingOverlay onCancel={handleCancelSearch} />}
        
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Entry Fee</DialogTitle>
                    <DialogDescription>
                        An amount of ₹{selectedFee} will be deducted from your wallet to join the match. Are you sure you want to proceed?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirmPlay}>Confirm & Play</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


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
        
        {activeMatchId && (
            <Alert variant="destructive" className="cursor-pointer" onClick={() => router.push(`/match/${activeMatchId}`)}>
                <Info className="h-4 w-4" />
                <AlertTitle>You have an active match!</AlertTitle>
                <AlertDescription>Click here to go to your match room and complete the game.</AlertDescription>
            </Alert>
        )}

      <Tabs defaultValue="low" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="low">Low Stakes</TabsTrigger>
            <TabsTrigger value="medium">Medium Stakes</TabsTrigger>
            <TabsTrigger value="high">High Stakes</TabsTrigger>
        </TabsList>
        <TabsContent value="low" className="pt-4">
            <FeeTier fees={lowStakes} />
        </TabsContent>
        <TabsContent value="medium" className="pt-4">
            <FeeTier fees={mediumStakes} />
        </TabsContent>
        <TabsContent value="high" className="pt-4">
            <FeeTier fees={highStakes} />
        </TabsContent>
      </Tabs>

       <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <ol>
            <li>Select an entry fee and click `Play`.</li>
            <li>We'll find an opponent for you.</li>
            <li>Once a match is found, you'll be redirected to the match room.</li>
            <li>Use the room code from the match room to play in your Ludo King app.</li>
            <li>After the game, come back and submit your result with a screenshot.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

    