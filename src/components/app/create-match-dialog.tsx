
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, Swords } from 'lucide-react';

export function CreateMatchDialog({ canCreate }: { canCreate: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [entryFee, setEntryFee] = useState(50);

  const handleCreateMatch = async () => {
    if (!user || !firestore) {
      toast({ title: 'You must be logged in to create a match.', variant: 'destructive' });
      return;
    }

    if (entryFee < 50) {
        toast({ title: 'Entry fee must be at least ₹50.', variant: 'destructive'});
        return;
    }

    setIsCreating(true);
    try {
        await addDoc(collection(firestore, 'matches'), {
            creatorId: user.uid,
            status: 'waiting',
            entryFee: entryFee,
            prizePool: entryFee * 1.8, // Assuming a 10% commission
            maxPlayers: 2,
            playerIds: [user.uid],
            players: [
                {
                    id: user.uid,
                    name: user.displayName || 'Anonymous',
                    avatarUrl: user.photoURL || '',
                }
            ],
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Match Created!', description: 'Your match is now waiting for an opponent.'});
        setOpen(false);

    } catch (error: any) {
        console.error("Error creating match:", error);
        toast({ title: 'Failed to create match', description: error.message, variant: 'destructive' });
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
             <Swords className='h-6 w-6 text-primary'/>
            Create a New Match
            </DialogTitle>
          <DialogDescription>
            Set the entry fee for your match. The prize will be calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entry-fee" className="text-right">
              Entry Fee (₹)
            </Label>
            <Input
              id="entry-fee"
              type="number"
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              className="col-span-3"
              min="50"
              step="10"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right">Prize Pool</Label>
             <div className="col-span-3 font-bold text-lg text-green-600">
                ₹{(entryFee * 1.8).toFixed(2)}
             </div>
           </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
          <Button onClick={handleCreateMatch} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirm & Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
