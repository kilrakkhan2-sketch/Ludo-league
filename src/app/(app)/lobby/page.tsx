'use client';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Loader2, Info, Lock, Wallet, Users, User, Shield, BarChart, X } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

const cardBgImage = PlaceHolderImages.find(img => img.id === 'ludo-background');

const EntryFeeCard = ({ 
    fee, 
    onPlay,
    isLocked = false,
    playerCount = 0,
}: { 
    fee: number; 
    onPlay: (fee: number) => void;
    isLocked: boolean;
    playerCount: number;
}) => {
    
    const cardStyle = cardBgImage ? { 
        backgroundImage: `url(${cardBgImage.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
     } : {};

    const cardContent = (
      <div
        style={cardStyle}
        className={cn(
          "relative flex flex-col h-[180px] text-white p-4 justify-between overflow-hidden rounded-lg border border-white/10 shadow-lg",
          isLocked && "grayscale"
        )}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-0"></div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full">
            {/* Top Content */}
            <div className="flex-grow">
                <h3 className="text-2xl font-bold drop-shadow-md">
                    ₹{fee}
                </h3>
                <p className="text-sm opacity-90 drop-shadow-sm">Entry Fee</p>

                <div className="mt-2 space-y-1">
                <p className="text-md font-semibold drop-shadow-sm">
                    Prize: <span className="text-green-400 font-bold">₹{(fee * 1.8).toFixed(2)}</span>
                </p>
                {playerCount > 0 && !isLocked && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 animate-pulse drop-shadow-sm">
                        <Users className="h-3 w-3" />
                        <span>{playerCount} Searching...</span>
                    </div>
                )}
                </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-auto">
                <Button className="w-full h-9 text-sm shadow-lg bg-gradient-to-r from-primary-start to-primary-end" onClick={() => onPlay(fee)} disabled={isLocked}>
                    <Swords className="mr-2 h-4 w-4" /> Play
                </Button>
            </div>
        </div>
        
        {/* Locked State Overlay */}
        {isLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-black/30">
                <div className="flex items-center gap-2 text-white font-bold text-lg drop-shadow-lg">
                    <Lock className="h-5 w-5" />
                    Locked
                </div>
            </div>
        )}
      </div>
    );

  if (isLocked) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
                <TooltipContent>
                    <p>Win more matches to unlock higher stakes.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  return cardContent;
};


const PlayerCard = ({ name, avatarUrl, winRate }: { name: string, avatarUrl: string | null | undefined, winRate: number }) => (
    <div className="flex flex-col items-center gap-3">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <p className="text-sm text-white/80">Win Rate: {winRate}%</p>
        </div>
    </div>
);

const SearchingCard = () => (
    <div className="flex flex-col items-center gap-3">
        <div className="h-24 w-24 rounded-full border-4 border-dashed border-white/50 bg-white/10 flex items-center justify-center shadow-lg animate-pulse">
            <User className="h-10 w-10 text-white/70"/>
        </div>
        <div className="text-center">
            <h3 className="text-lg font-bold text-white">Searching...</h3>
            <p className="text-sm text-white/80">Finding opponent</p>
        </div>
    </div>
);


const SearchingOverlay = ({ user, userProfile, onCancel }: { user: any, userProfile: any, onCancel: () => void }) => (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4"
            style={{
                background: 'radial-gradient(circle, rgba(20,27,47,0.95) 0%, rgba(10,13,24,0.98) 100%)'
            }}
        >
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center justify-around w-full max-w-md"
            >
                <PlayerCard name={user.displayName} avatarUrl={user.photoURL} winRate={userProfile?.winRate || 0} />
                <div className="text-5xl font-black text-white/50 mx-4">VS</div>
                <SearchingCard />
            </motion.div>

            <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.5, duration: 0.5 }}
                 className="text-center mt-12"
            >
                <h2 className="text-2xl font-bold text-white">Finding the perfect opponent for you...</h2>
                <p className="text-white/60 mt-2">This usually takes just a few moments.</p>
            </motion.div>
            
            <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0-20, opacity: 1 }}
                 transition={{ delay: 0.8, duration: 0.5 }}
                 className="absolute bottom-10"
            >
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4"/> Cancel Search
                </Button>
            </motion.div>
        </motion.div>
    </AnimatePresence>
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
  const [queueCounts, setQueueCounts] = useState<{ [key: number]: number }>({});

  // Listen for active match on user profile
  useEffect(() => {
    if (userProfile?.activeMatchId) {
        if (isSearching) {
            toast({ title: "Match Found!", description: "Redirecting you to the match room..." });
            router.push(`/match/${userProfile.activeMatchId}`);
        }
        setActiveMatchId(userProfile.activeMatchId);
    } else {
        setActiveMatchId(null);
    }
  }, [userProfile, isSearching, router, toast]);

  // Listen for changes in the matchmaking queue
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'matchmakingQueue'), where('status', '==', 'waiting'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: { [key: number]: number } = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            const fee = data.entryFee;
            if (counts[fee]) {
                counts[fee]++;
            } else {
                counts[fee] = 1;
            }
        });
        setQueueCounts(counts);
    });

    return () => unsubscribe();
  }, [firestore]);


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

  // Ensure new users can play. If maxUnlockedAmount is 0 or undefined, default to 100.
  const maxUnlockedAmount = userProfile?.maxUnlockedAmount || 100;

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
            playerCount={queueCounts[fee] || 0}
          />
        )
      })}
    </div>
  );

  const bannerImage = PlaceHolderImages.find(img => img.id === 'ludo-banner');

  return (
    <div className="space-y-6">
        {isSearching && <SearchingOverlay user={user} userProfile={userProfile} onCancel={handleCancelSearch} />}
        
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary"/>
                        Confirm Match Entry
                    </DialogTitle>
                    <DialogDescription>
                        Please confirm that you want to join a match with an entry fee of ₹{selectedFee}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Current Wallet Balance:</span>
                        <span className="font-medium">₹{userProfile?.walletBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Entry Fee:</span>
                        <span className="font-medium text-destructive">- ₹{selectedFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed my-2"></div>
                    <div className="flex justify-between items-center font-semibold text-md">
                        <span className="text-muted-foreground">Estimated Balance After:</span>
                        <span>₹{(userProfile?.walletBalance - selectedFee).toFixed(2)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirmPlay}>Confirm & Play for ₹{selectedFee}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


        {bannerImage && (
             <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image src={bannerImage.imageUrl} alt={bannerImage.description} fill className="object-cover" data-ai-hint={bannerImage.imageHint}/>
            </div>
        )}
        
        {activeMatchId && (
            <Alert variant="destructive" className="cursor-pointer border-2 shadow-sm" onClick={() => router.push(`/match/${activeMatchId}`)}>
                <Info className="h-4 w-4" />
                <AlertTitle className="font-bold">You have an active match!</AlertTitle>
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

       <div className="prose prose-sm dark:prose-invert text-card-foreground p-6 border rounded-lg">
        <h3 className='font-bold text-lg'>How to Play</h3>
          <ol className="space-y-2 mt-4">
            <li>Select an entry fee and click <span className='font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm'>Play</span>.</li>
            <li>Wait for us to find a suitable opponent for you.</li>
            <li>Once a match is found, you will be automatically redirected to the match room.</li>
            <li>Copy the room code from the a new one and use it to play in your Ludo King app.</li>
            <li>After the game, take a screenshot of the win/loss screen.</li>
            <li>Come back to the app and submit your result with the screenshot to claim your winnings.</li>
          </ol>
        </div>
    </div>
  );
}
