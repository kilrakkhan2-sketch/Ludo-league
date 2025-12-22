
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { useFunctions } from '@/firebase'; 
import { AppShell } from '@/components/layout/AppShell'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// A basic toast hook replacement if useToast is not available
const showToast = (message: string) => {
  // In a real app, you'd use a proper toast library
  alert(message);
};

export default function CreateMatchPage() {
  const router = useRouter();
  const functions = useFunctions();
  const createMatch = httpsCallable(functions, 'createMatch');
  const [title, setTitle] = useState('');
  const [entryFee, setEntryFee] = useState('0');
  const [maxPlayers, setMaxPlayers] = useState('2');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateMatch = async () => {
    setIsLoading(true);

    const fee = parseInt(entryFee, 10);
    const players = parseInt(maxPlayers, 10);

    if (!title.trim()) {
      showToast("Validation Error: Please enter a match title.");
      setIsLoading(false);
      return;
    }

    if (isNaN(fee) || fee < 0) {
        showToast("Validation Error: Please enter a valid, non-negative entry fee.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createMatch({
        title,
        entryFee: fee,
        maxPlayers: players,
      });
      
      const resultData = result.data as { matchId?: string; status?: string; message?: string };

      if (resultData.status === 'success' && resultData.matchId) {
        showToast("Match created successfully!");
        router.push(`/match/${resultData.matchId}`);
      } else {
        throw new Error(resultData.message || 'Failed to create match.');
      }

    } catch (error: any) {
      console.error("Error creating match:", error);
      // The error object from callable functions has a `message` property
      showToast(`Error: ${error.message || "An unexpected error occurred."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell pageTitle="Create New Match" showBackButton>
      <div className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>New Match Details</CardTitle>
            <CardDescription>
              Fill out the details below to create your own match. The prize pool will be automatically calculated based on a 10% commission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Match Title</Label>
              <Input
                id="title"
                placeholder="e.g., Ludo King Challenge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
              <Input
                id="entry-fee"
                type="number"
                placeholder="e.g., 50"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                min="0"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Players</Label>
              <RadioGroup
                value={maxPlayers}
                onValueChange={setMaxPlayers}
                className="flex gap-4"
                // disabled={isLoading} TODO: Fix this
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="players-2" />
                  <Label htmlFor="players-2">2 Players</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="players-4" />
                  <Label htmlFor="players-4">4 Players</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateMatch} disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Match...' : `Create Match & Pay ₹${entryFee || 0}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
