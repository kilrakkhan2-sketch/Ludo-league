'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { useDoc } from '@/firebase';
import type { MaintenanceSettings } from '@/types';
import { isTimeInDisabledRange } from '@/components/layout/MaintenanceShield';

const feeOptions = [10, 50, 100];

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: maintenanceSettings, loading: maintenanceLoading } = useDoc<MaintenanceSettings>('settings/maintenance');


  const [title, setTitle] = useState('');
  const [entryFee, setEntryFee] = useState('50');
  const [customFee, setCustomFee] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeeChange = (value: string) => {
    setEntryFee(value);
    if (value !== 'custom') {
      setCustomFee('');
    }
  };
  
  const handleCreateMatch = async () => {
    let finalFee: number;
    if (entryFee === 'custom') {
      const parsedCustomFee = parseInt(customFee, 10);
      if (!customFee || isNaN(parsedCustomFee) || parsedCustomFee <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Custom Fee',
          description: 'Please enter a valid positive number for the custom entry fee.',
        });
        return;
      }
      finalFee = parsedCustomFee;
    } else {
      finalFee = parseInt(entryFee, 10);
    }

    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a match title.' });
      return;
    }

    setIsSubmitting(true);
    
    // The createMatch function will be re-enabled or modified in a future step
    // For now, this logic is prepared for when it's ready.
    toast({
      variant: 'destructive',
      title: 'Functionality Disabled',
      description: 'Match creation is temporarily disabled while we upgrade the system.',
    });
    setIsSubmitting(false);

    // TODO: Re-enable the following code once the `createMatch` cloud function is rebuilt.
    /*
    const functions = getFunctions();
    const createMatchCloudFunction = httpsCallable(functions, 'createMatch');

    try {
      const result = await createMatchCloudFunction({
        title,
        entryFee: finalFee,
        maxPlayers: parseInt(maxPlayers),
      });

      toast({ title: 'Match Created!', description: 'Your match is now live and waiting for players.' });
      // @ts-ignore
      router.push(`/match/${result.data.matchId}`);

    } catch (error: any) {
      console.error("Error creating match:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Creation Failed', 
        description: error.message || 'An unexpected error occurred.' 
      });
    } finally {
      setIsSubmitting(false);
    }
    */
  };
  
  const matchesGloballyDisabled = maintenanceSettings?.areMatchesDisabled || false;
  const matchesTimeDisabled = maintenanceSettings?.matchesTimeScheduled && isTimeInDisabledRange(maintenanceSettings.matchesStartTime, maintenanceSettings.matchesEndTime);
  const areMatchesDisabled = matchesGloballyDisabled || matchesTimeDisabled;


  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">Create Match</h1>
        </header>

        <main className="flex-grow p-4 space-y-6">
             {/* Step 1: Basic Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <h2 className="font-semibold text-lg">Basic Info</h2>
                </div>
                 <div className="space-y-2 pl-9">
                    <Label htmlFor="title">Match Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Weekend Warriors"
                    />
                </div>
            </div>

            {/* Step 2: Entry Details */}
            <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <h2 className="font-semibold text-lg">Entry Details</h2>
                </div>
                <div className="pl-9 space-y-3">
                    <Label>Entry Fee (₹)</Label>
                    <RadioGroup value={entryFee} onValueChange={handleFeeChange} className="flex items-center gap-2 flex-wrap">
                        {feeOptions.map(fee => (
                        <Label key={fee} htmlFor={`fee-${fee}`} className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                            <RadioGroupItem value={fee.toString()} id={`fee-${fee}`} />
                            ₹{fee}
                        </Label>
                        ))}
                        <Label htmlFor="fee-custom" className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
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
            </div>

             {/* Step 3: Game Settings */}
            <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <h2 className="font-semibold text-lg">Game Settings</h2>
                </div>
                 <div className="pl-9 space-y-3">
                    <Label>Max Players</Label>
                    <RadioGroup value={maxPlayers} onValueChange={setMaxPlayers} className="flex items-center gap-2 mt-2">
                        <Label htmlFor="players-2" className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                        <RadioGroupItem value="2" id="players-2" />
                        2 Players
                        </Label>
                        <Label htmlFor="players-4" className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                        <RadioGroupItem value="4" id="players-4" />
                        4 Players
                        </Label>
                    </RadioGroup>
                </div>
            </div>
        </main>
        
        <footer className="p-4 sticky bottom-0 bg-background border-t">
             <Button onClick={handleCreateMatch} className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90" disabled={isSubmitting || areMatchesDisabled}>
              {isSubmitting ? 'Creating Match...' : (areMatchesDisabled ? 'Match Creation Disabled' : 'Create Match')}
            </Button>
        </footer>
    </div>
  );
}
