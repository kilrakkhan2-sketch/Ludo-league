
'use client';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Swords, Loader2, Info, Users, Wallet } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
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
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-lobby');

const EntryFeeCard = ({ fee, onPlay }: { fee: number; onPlay: (fee: number) => void }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <Card className="flex flex-col h-full text-center bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-start to-primary-end">
            ₹{fee}
          </CardTitle>
          <CardDescription>Entry Fee</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-lg font-semibold">Prize: <span className="text-green-500">₹{(fee * 1.8).toFixed(2)}</span></p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => onPlay(fee)}>
            <Swords className="mr-2 h-4 w-4" /> Play Now
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
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
        // If we are searching and an activeMatchId appears, it means we found a match.
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
    // Pre-checks
    if (!user || !userProfile) {
        toast({ title: "Please login to play.", variant: "destructive" });
        return;
    }
    if (userProfile.isBlocked) {
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
    if (!user || !firestore) return;

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

  const entryFees = [50, 100, 250, 500];

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {entryFees.map(fee => (
              <EntryFeeCard key={fee} fee={fee} onPlay={handlePlayClick} />
          ))}
      </div>

       <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <ol>
            <li>Select an entry fee and click `Play Now`.</li>
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
