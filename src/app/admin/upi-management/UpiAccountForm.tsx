
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UpiAccount } from '@/types';

export const UpiAccountForm = ({ account, onSave, onOpenChange }: { account?: UpiAccount | null, onSave: () => void, onOpenChange: (open: boolean) => void }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [upiId, setUpiId] = useState(account?.upiId || '');
    const [displayName, setDisplayName] = useState(account?.displayName || '');
    const [dailyLimit, setDailyLimit] = useState(account?.dailyLimit || 50000);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!firestore || !upiId || !displayName) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all fields.' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (account) {
                const dataToUpdate = { upiId, displayName, dailyLimit: Number(dailyLimit) };
                await updateDoc(doc(firestore, 'upi-accounts', account.id), dataToUpdate);
                toast({ title: 'UPI Account Updated' });
            } else {
                const dataToCreate = { 
                    upiId, 
                    displayName, 
                    dailyLimit: Number(dailyLimit),
                    isActive: true, 
                    dailyAmountReceived: 0, 
                    dailyTransactionCount: 0,
                    createdAt: serverTimestamp() 
                };
                await addDoc(collection(firestore, 'upi-accounts'), dataToCreate);
                toast({ title: 'UPI Account Added' });
            }
            onSave();
        } catch (error: any) {
            console.error("Error saving UPI account:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'You might not have permission for this action.' });
        } finally {
            setIsSubmitting(false);
            onOpenChange(false);
        }
    };

    return (
         <DialogContent>
            <DialogHeader><DialogTitle>{account ? 'Edit' : 'Add'} UPI Account</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="displayName">Display Name</Label><Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Primary Business UPI" /></div>
                <div className="grid gap-2"><Label htmlFor="upiId">UPI ID</Label><Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="your-id@okhdfcbank" /></div>
                <div className="grid gap-2"><Label htmlFor="dailyLimit">Daily Limit (₹)</Label><Input id="dailyLimit" type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} /></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
        </DialogContent>
    );
}
