
'use client';

import { useState } from 'react';
import { Match, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { useFirebase, useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function MatchActions({ match }: { match: Match }) {
  const functions = useFunctions();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelMatch = async () => {
    if (!functions || !window.confirm("Are you sure? This will refund all players and cancel the match.")) return;
    setIsSubmitting(true);
    const cancelMatchFn = httpsCallable(functions, 'cancelMatch');
    try {
        await cancelMatchFn({ matchId: match.id });
        toast({ title: "Match Cancelled", description: "All players have been refunded." });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Error", description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeclareWinner = async () => {
    if (!functions || !winnerId) return;
    setIsSubmitting(true);
    const resolveMatchFn = httpsCallable(functions, 'resolveMatch');
    try {
        await resolveMatchFn({ matchId: match.id, winnerId });
        toast({ title: "Winner Declared!", description: `Payout for ${winnerId} has been triggered.` });
        setIsOpen(false);
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Error", description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isCompleted = ['PAID', 'cancelled'].includes(match.status);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isCompleted}>Declare Result</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader><DialogTitle>Manually Resolve Match</DialogTitle><DialogDescription>Select the winner to trigger the payout. This action is final.</DialogDescription></DialogHeader>
            <div className="py-4">
                <Label htmlFor="winner-select">Select Winner</Label>
                <Select onValueChange={setWinnerId}>
                    <SelectTrigger id="winner-select"><SelectValue placeholder="Choose a player..." /></SelectTrigger>
                    <SelectContent>
                        {match.players.map(pId => <SelectItem key={pId} value={pId}>{pId}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleDeclareWinner} disabled={isSubmitting || !winnerId}>{isSubmitting ? 'Declaring...' : 'Confirm Winner'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="destructive" size="sm" onClick={handleCancelMatch} disabled={isCompleted}>Cancel Match</Button>
    </div>
  );
}
