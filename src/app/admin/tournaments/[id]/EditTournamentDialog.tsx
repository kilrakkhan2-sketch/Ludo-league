
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import type { Tournament } from '@/types';

export const EditTournamentDialog = ({ tournament, open, onOpenChange, onSave }: { tournament: Tournament, open: boolean, onOpenChange: (open: boolean) => void, onSave: () => void }) => {
    const functions = useFunctions();
    const [name, setName] = useState(tournament?.name || '');
    const [description, setDescription] = useState(tournament?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveChanges = async () => {
        if (!functions || !tournament) return;
        setIsSubmitting(true);
        try {
            const updateTournamentFn = httpsCallable(functions, 'updateTournament');
            await updateTournamentFn({ tournamentId: tournament.id, name, description });
            toast.success("Tournament details updated.");
            onSave();
        } catch(error: any) {
             toast.error(`Update failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Tournament</DialogTitle>
                    <DialogDescription>Update the core details of the tournament.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
