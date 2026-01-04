
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser, useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { addDoc, collection, doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore"
import { Loader2, PlusCircle } from "lucide-react"
import { useState } from "react"

export function CreateMatchDialog() {
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [entryFee, setEntryFee] = useState(100);
    const [maxPlayers, setMaxPlayers] = useState("4");

    const handleCreateMatch = async () => {
        if (!user || !firestore || !userProfile) {
            toast({ title: "Please login to create a match.", variant: "destructive" });
            return;
        }

        if (userProfile.walletBalance < entryFee) {
            toast({ title: "Insufficient wallet balance", description: "Please deposit funds to create a match.", variant: "destructive" });
            return;
        }
        
        setIsCreating(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            
            // Use a transaction to ensure atomicity
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists() || (userDoc.data().walletBalance || 0) < entryFee) {
                    throw new Error("Insufficient funds or user not found.");
                }

                const newBalance = userDoc.data().walletBalance - entryFee;
                transaction.update(userRef, { walletBalance: newBalance });

                // Create the new match document
                const commission = 0.05; // 5% commission
                const prizePool = (entryFee * Number(maxPlayers)) * (1 - commission);
                
                const newMatchRef = doc(collection(firestore, 'matches'));
                transaction.set(newMatchRef, {
                    creatorId: user.uid,
                    entryFee,
                    prizePool,
                    maxPlayers: Number(maxPlayers),
                    playerIds: [user.uid],
                    players: [{ id: user.uid, name: user.displayName, avatarUrl: user.photoURL, winRate: userProfile.winRate || 0 }],
                    status: "waiting",
                    createdAt: serverTimestamp(),
                });

                // Create a transaction log
                const transactionRef = doc(collection(firestore, 'transactions'));
                transaction.set(transactionRef, {
                    userId: user.uid,
                    type: "entry-fee",
                    amount: -entryFee,
                    status: "completed",
                    createdAt: Timestamp.now(),
                    relatedMatchId: newMatchRef.id,
                    description: `Created match ${newMatchRef.id}`
                });
            });

            toast({ 
                variant: "success",
                title: "Match Created Successfully!",
                description: "Your match is now live in the lobby for others to join."
            });
            setOpen(false);

        } catch (error: any) {
            console.error("Error creating match: ", error);
            toast({ title: "Failed to create match", description: error.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1 bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Create Match
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            Set the details for your new Ludo match. The entry fee will be locked from your wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entry-fee" className="text-right">
              Entry Fee
            </Label>
            <Input id="entry-fee" type="number" value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="players" className="text-right">
              Players
            </Label>
            <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select number of players" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateMatch} variant="accent" disabled={isCreating}>
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
