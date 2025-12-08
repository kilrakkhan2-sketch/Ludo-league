
'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Match, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminMatchesPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('verification');
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const { data: matches, loading: matchesLoading } = useCollection<Match>('matches', {
    where: ['status', '==', statusFilter],
    orderBy: ['createdAt', 'desc'],
  });

  const { data: users } = useCollection<UserProfile>('users');

  const handleDeclareWinner = async (match: Match) => {
    if (!firestore || !selectedWinner) return;

    try {
        const batch = writeBatch(firestore);

        const matchRef = doc(firestore, 'matches', match.id);
        const winnerRef = doc(firestore, 'users', selectedWinner);
        const winnerUser = users.find((u: UserProfile) => u.id === selectedWinner);

        if(!winnerUser) throw new Error('Winner user not found');

        // 1. Update match status and winner
        batch.update(matchRef, { status: 'completed', winnerId: selectedWinner });

        // 2. Update winner's wallet
        const prizePool = match.prizePool || 0;
        const newBalance = (winnerUser.walletBalance || 0) + prizePool;
        batch.update(winnerRef, { walletBalance: newBalance });

        // 3. Create a transaction record
        const transactionRef = doc(collection(firestore, `users/${selectedWinner}/transactions`));
        batch.set(transactionRef, {
            amount: prizePool,
            type: 'win',
            description: `Prize money for match: ${match.title}`,
            createdAt: new Date(),
        });

        await batch.commit();

        toast({ title: 'Winner Declared!', description: `${winnerUser.name} has been awarded ₹${prizePool}.` });
        setSelectedWinner(null);
    } catch (error) {
        console.error("Error declaring winner:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not declare winner.' });
    }
  };

  const getUserName = (userId: string) => users.find((u: UserProfile) => u.id === userId)?.name || 'Unknown';

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Manage Matches</h1>
         <div className="flex space-x-2">
            <Button variant={statusFilter === 'verification' ? 'default' : 'outline'} onClick={() => setStatusFilter('verification')}>Verification</Button>
            <Button variant={statusFilter === 'ongoing' ? 'default' : 'outline'} onClick={() => setStatusFilter('ongoing')}>Ongoing</Button>
            <Button variant={statusFilter === 'open' ? 'default' : 'outline'} onClick={() => setStatusFilter('open')}>Open</Button>
            <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => setStatusFilter('completed')}>Completed</Button>
        </div>
        <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Prize</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
                {matchesLoading ? <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow> : matches.map((match: Match) => (
                    <TableRow key={match.id}>
                        <TableCell>{match.title}</TableCell>
                        <TableCell>₹{match.prizePool || 0}</TableCell>
                        <TableCell>{format(new Date(match.createdAt.seconds * 1000), 'dd MMM, HH:mm')}</TableCell>
                        <TableCell><Badge>{match.status}</Badge></TableCell>
                        <TableCell>
                            {match.status === 'verification' && (
                                <Dialog onOpenChange={() => setSelectedWinner(null)}>
                                    <DialogTrigger asChild><Button size="sm">Verify</Button></DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Verify Match: {match.title}</DialogTitle>
                                            <DialogDescription>Review screenshots and declare a winner.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                            {match.results?.map((result: { userId: string; screenshotUrl: string; }) => (
                                                <div key={result.userId} className="space-y-2">
                                                    <p className="font-bold">{getUserName(result.userId)}</p>
                                                    <img src={result.screenshotUrl} alt="Result screenshot" className="rounded-md"/>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Select onValueChange={setSelectedWinner}>
                                                <SelectTrigger><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                                <SelectContent>
                                                    {match.players.map((pId: string) => (
                                                        <SelectItem key={pId} value={pId}>{getUserName(pId)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={() => handleDeclareWinner(match)} disabled={!selectedWinner}>Declare Winner & Pay</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
