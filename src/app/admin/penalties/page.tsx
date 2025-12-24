
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFunctions } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { ShieldAlert } from 'lucide-react';

export default function PenaltiesPage() {
    const functions = useFunctions();
    const { toast } = useToast();
    
    const [userId, setUserId] = useState('');
    const [reason, setReason] = useState('wrong_result');
    const [amount, setAmount] = useState(50);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApplyPenalty = async () => {
        if (!userId || !reason || amount <= 0) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide User ID, reason, and a valid amount.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const applyPenaltyFn = httpsCallable(functions, 'applyPenalty');
            const result = await applyPenaltyFn({ userId, reason, amount, description });
            toast({ title: 'Penalty Applied', description: `₹${amount} deducted from user ${userId}.` });
            // Reset form
            setUserId('');
            setReason('wrong_result');
            setAmount(50);
            setDescription('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Apply Penalty</h1>
                <p className="text-muted-foreground">Manually apply a penalty to a user's wallet for violations.</p>
            </div>
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert /> New Penalty</CardTitle>
                    <CardDescription>The penalty amount will be deducted from the user's wallet and a transaction will be logged.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userId">User ID</Label>
                        <Input id="userId" placeholder="Enter the user's unique ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Penalty</Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger id="reason"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wrong_result">Wrong Result Submission</SelectItem>
                                    <SelectItem value="abusive_language">Abusive Language</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" placeholder="Provide more details about the violation..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <Button onClick={handleApplyPenalty} disabled={isSubmitting || !userId || !amount}>
                        {isSubmitting ? 'Applying Penalty...' : 'Apply Penalty'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
