
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFunctions } from '@/firebase';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const feeOptions = [50, 100, 250, 500]; // Added more options

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const functions = useFunctions();
  
  const [entryFee, setEntryFee] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateMatch = async () => {
    if (!functions) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }
      
    const finalFee = parseInt(entryFee, 10);
    setIsSubmitting(true);
    
    const createMatchFn = httpsCallable(functions, 'createMatch');

    try {
      const result = await createMatchFn({ title: `Ludo Match for ₹${finalFee}`, entryFee: finalFee, maxPlayers: 2 });
      const data = result.data as { matchId?: string; status?: string };

      if (data.status === 'success' && data.matchId) {
        toast({ title: 'Match Created!', description: 'Your match is now live.' });
        router.push(`/match/${data.matchId}`);
      } else {
         throw new Error('Failed to create match.');
      }
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Creation Failed', 
        description: error.message || 'Your wallet may have insufficient funds.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const prizeAmount = (parseInt(entryFee, 10) * 2 * 0.95).toFixed(2); // Assuming 5% commission for display

  return (
    <AppShell pageTitle="Create New Match" showBackButton>
       {/* Centered and max-width container */}
       <div className="flex justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                  <CardTitle>Set Match Fee</CardTitle>
                  <CardDescription>Choose the entry fee for your match. The prize will be calculated automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                   <RadioGroup defaultValue={entryFee} onValueChange={setEntryFee} className="grid grid-cols-2 gap-4">
                      {feeOptions.map(fee => (
                      <Label key={fee} htmlFor={`fee-${fee}`} className="flex flex-col items-center justify-center gap-2 cursor-pointer border rounded-lg p-6 text-xl font-bold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors hover:bg-muted/50">
                          <RadioGroupItem value={fee.toString()} id={`fee-${fee}`} className="sr-only" />
                          ₹{fee}
                      </Label>
                      ))}
                  </RadioGroup>
                   <div className="text-center text-sm text-muted-foreground pt-2">
                     <p>Winner gets <span className="font-bold text-foreground">₹{prizeAmount}</span> (after platform fee)</p>
                   </div>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleCreateMatch} size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Match...' : `Create ₹${entryFee} Match`}
                  </Button>
              </CardFooter>
            </Card>
        </div>
      </div>
    </AppShell>
  );
}
