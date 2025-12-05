
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { doc, runTransaction, Timestamp, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const feeOptions = [10, 50, 100];

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [entryFee, setEntryFee] = useState('50');
  const [customFee, setCustomFee] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [ludoKingCode, setLudoKingCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeeChange = (value: string) => {
    setEntryFee(value);
    if (value !== 'custom') {
      setCustomFee('');
    }
  };

  const validateForm = (fee: number) => {
    if (!title || !ludoKingCode || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
      return false;
    }
    if (ludoKingCode.length !== 9) {
      toast({ variant: 'destructive', title: 'Invalid Ludo King Code', description: 'The code must be 9 characters long.' });
      return false;
    }
    if (isNaN(fee) || fee <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Fee', description: 'Please enter a valid positive number for the entry fee.' });
      return false;
    }
    return true;
  };

  const createMatchTransaction = async (finalFee: number) => {
    if (!firestore || !user) return;

    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists() || (userDoc.data().walletBalance || 0) < finalFee) {
        throw new Error('Insufficient balance');
      }

      const newBalance = userDoc.data().walletBalance - finalFee;
      transaction.update(userRef, { walletBalance: newBalance });

      const matchRef = doc(collection(firestore, 'matches'));
      const matchData = {
        title,
        entryFee: finalFee,
        maxPlayers,
        ludoKingCode,
        creatorId: user.uid,
        players: [user.uid],
        status: 'open',
        createdAt: Timestamp.now(),
        prizePool: finalFee * 0.9, // 10% platform fee
      };
      transaction.set(matchRef, matchData);

      const txRef = doc(collection(firestore, `users/${user.uid}/transactions`));
      const txData = {
        matchId: matchRef.id,
        amount: -finalFee,
        type: 'entry_fee',
        description: `Entry fee for "${title}"`,
        createdAt: Timestamp.now(),
      };
      transaction.set(txRef, txData);
    });
  };

  const handleSubmit = async () => {
    let finalFee: number;

    // === BULLETPROOF NaN CHECK ===
    if (entryFee === 'custom') {
      const parsedCustomFee = parseInt(customFee, 10);
      if (!customFee || isNaN(parsedCustomFee) || parsedCustomFee <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Custom Fee',
          description: 'Please enter a valid positive number for the custom entry fee.',
        });
        return; // STOP EXECUTION HERE
      }
      finalFee = parsedCustomFee;
    } else {
      finalFee = parseInt(entryFee, 10);
    }

    if (!validateForm(finalFee)) return;

    setIsSubmitting(true);
    try {
      await createMatchTransaction(finalFee);
      toast({ title: 'Match Created!', description: 'Your match is now live and open for others to join.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Match creation error:', error);
      let description = 'Could not create the match. Please try again.';
      if (error.message === 'Insufficient balance') {
        description = 'Your wallet balance is not sufficient.';
      }
      toast({ variant: 'destructive', title: 'Creation Failed', description });
    }
    setIsSubmitting(false);
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-headline mb-4">Create a New Match</h1>
        <div className="max-w-lg mx-auto bg-card p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Match Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekend Warriors"
              />
            </div>
            <div>
              <Label>Entry Fee</Label>
              <RadioGroup value={entryFee} onValueChange={handleFeeChange} className="flex items-center gap-4 mt-2">
                {feeOptions.map(fee => (
                  <Label key={fee} htmlFor={`fee-${fee}`} className="flex items-center gap-2 cursor-pointer border rounded-full px-4 py-2 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                    <RadioGroupItem value={fee.toString()} id={`fee-${fee}`} />
                    ₹{fee}
                  </Label>
                ))}
                <Label htmlFor="fee-custom" className="flex items-center gap-2 cursor-pointer border rounded-full px-4 py-2 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <RadioGroupItem value="custom" id="fee-custom" />
                  Custom
                </Label>
              </RadioGroup>
              {entryFee === 'custom' && (
                <Input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  placeholder="Enter custom fee"
                  className="mt-2"
                  min="1"
                />
              )}
            </div>
            <div>
              <Label>Max Players</Label>
              <RadioGroup value={maxPlayers.toString()} onValueChange={val => setMaxPlayers(parseInt(val))} className="flex items-center gap-4 mt-2">
                <Label htmlFor="players-2" className="flex items-center gap-2 cursor-pointer border rounded-full px-4 py-2 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <RadioGroupItem value="2" id="players-2" />
                  2 Players
                </Label>
                <Label htmlFor="players-4" className="flex items-center gap-2 cursor-pointer border rounded-full px-4 py-2 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                  <RadioGroupItem value="4" id="players-4" />
                  4 Players
                </Label>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="ludoKingCode">Ludo King Room Code</Label>
              <Input
                id="ludoKingCode"
                value={ludoKingCode}
                onChange={(e) => setLudoKingCode(e.target.value.toUpperCase())}
                placeholder="Enter the 9-character code from Ludo King"
                maxLength={9}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Match...' : 'Create Match & Deduct Fee'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
