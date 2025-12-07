
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Gamepad2, Users, Shield } from 'lucide-react';

const feeOptions = [10, 50, 100];

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();

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

    if (!title.trim() || !ludoKingCode.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
      return;
    }
    
    if (ludoKingCode.length < 4) { // Ludo King codes can vary in length
      toast({ variant: 'destructive', title: 'Invalid Room Code', description: 'The room code seems too short.' });
      return;
    }

    setIsSubmitting(true);
    
    const functions = getFunctions();
    const createMatchCloudFunction = httpsCallable(functions, 'createMatch');

    try {
      const prizePool = finalFee * maxPlayers * 0.9; // 90% of total entry fees

      const result = await createMatchCloudFunction({
        title,
        entryFee: finalFee,
        prizePool,
        ludoKingCode,
        maxPlayers,
        status: 'open',
        privacy: 'public',
      });

      toast({ title: 'Match Created!', description: 'Your match is now live.' });
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
  };

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
                <div className="space-y-2 pl-9">
                    <Label htmlFor="ludoKingCode">Ludo King Room Code</Label>
                    <Input
                        id="ludoKingCode"
                        value={ludoKingCode}
                        onChange={(e) => setLudoKingCode(e.target.value.toUpperCase())}
                        placeholder="Enter the code from Ludo King"
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
                    <Label>Entry Fee</Label>
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

             {/* Step 3: Advanced Settings (Simplified) */}
            <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <h2 className="font-semibold text-lg">Game Settings</h2>
                </div>
                 <div className="pl-9 space-y-3">
                    <Label>Max Players</Label>
                    <RadioGroup value={maxPlayers.toString()} onValueChange={val => setMaxPlayers(parseInt(val))} className="flex items-center gap-2 mt-2">
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
             <Button onClick={handleCreateMatch} className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Match...' : 'Create Match & Play'}
            </Button>
        </footer>
    </div>
  );
}
