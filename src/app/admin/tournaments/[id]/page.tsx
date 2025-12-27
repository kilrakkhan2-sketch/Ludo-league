
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase, useFunctions } from '@/firebase/provider';
import type { Tournament, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trophy, Ticket, Clock, Edit, Check, X, UserX, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { httpsCallable } from 'firebase/functions';
import { EditTournamentDialog } from './EditTournamentDialog';

const StatCard = ({ icon: Icon, title, value, isLoading }: { icon: React.ElementType, title: string, value: string | number, isLoading: boolean }) => (
    <div className="flex items-center p-4 bg-muted rounded-lg">
        <div className="p-3 bg-primary/10 rounded-full mr-4"><Icon className="h-6 w-6 text-primary" /></div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <p className="text-xl font-bold">{value}</p>}
        </div>
    </div>
);

export default function ManageTournamentPage() {
    const params = useParams();
    const router = useRouter();
    const tournamentId = params?.id as string;
    const { firestore } = useFirebase();
    const functions = useFunctions();
    const { user: adminUser } = useUser();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<null | 'cancel' | { type: 'removePlayer', playerId: string }>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data: tournament, loading: tournamentLoading, refetch } = useDoc<Tournament>(`tournaments/${tournamentId}`);
    
    const { data: players, loading: playersLoading } = useCollection<UserProfile>(
        tournament ? `tournaments/${tournamentId}/players` : undefined,
        { orderBy: ['joinedAt', 'desc'] }
    );

    const isLoading = tournamentLoading || playersLoading;

    const handleStatusChange = async (newStatus: Tournament['status']) => {
        if (!firestore || !adminUser || !tournament || newStatus === tournament.status) return;

        setIsSubmitting(true);
        try {
            const tournamentRef = doc(firestore, 'tournaments', tournamentId);
            await updateDoc(tournamentRef, {
                status: newStatus,
                ...(newStatus === 'completed' && { completedAt: serverTimestamp() }),
                ...(newStatus === 'live' && { startedAt: serverTimestamp() })
            });
            toast.success(`Tournament status updated to "${newStatus}".`);
            refetch();
        } catch (error: any) {
            toast.error("Failed to update status", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!functions || !tournament || !actionToConfirm) return;
        setIsSubmitting(true);

        try {
            if (actionToConfirm === 'cancel') {
                const cancelTournamentFn = httpsCallable(functions, 'cancelTournament');
                await cancelTournamentFn({ tournamentId });
                toast.success('Tournament Cancelled', { description: 'All players have been refunded.' });
                router.push('/admin/tournaments');
            } else if (typeof actionToConfirm === 'object' && actionToConfirm.type === 'removePlayer') {
                const removePlayerFn = httpsCallable(functions, 'removePlayerFromTournament');
                await removePlayerFn({ tournamentId, playerId: actionToConfirm.playerId });
                toast.success('Player Removed', { description: 'The player has been removed and refunded.' });
            }
        } catch (error: any) {
            toast.error(`Action Failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            setActionToConfirm(null);
        }
    };

    if (isLoading) {
        return <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <div className="grid md:grid-cols-4 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
            <Skeleton className="h-64 w-full" />
        </div>
    }

    if (!tournament) {
        return <div className="text-center py-10"><h2 className="text-2xl font-bold">Tournament Not Found</h2><p className="text-muted-foreground">The requested tournament could not be found.</p></div>
    }

    return (
        <div className="space-y-6">
            <EditTournamentDialog tournament={tournament} open={isEditOpen} onOpenChange={setIsEditOpen} onSave={refetch} />
            <div>
                <h1 className="text-2xl font-bold">{tournament.name}</h1>
                <p className="text-muted-foreground">Manage tournament details, players, and status.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Ticket} title="Entry Fee" value={`₹${tournament.entryFee}`} isLoading={isLoading} />
                <StatCard icon={Trophy} title="Prize Pool" value={`₹${tournament.prizePool.toLocaleString()}`} isLoading={isLoading} />
                <StatCard icon={Users} title="Players" value={`${players?.length || 0} / ${tournament.maxPlayers}`} isLoading={isLoading} />
                <StatCard icon={Clock} title="Starts" value={tournament.startDate ? format(tournament.startDate.toDate(), 'PP') : 'N/A'} isLoading={isLoading} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Registered Players</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Email</TableHead><TableHead>Joined At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {players && players.length > 0 ? players.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3"><Avatar className="h-8 w-8 border"><AvatarImage src={p.photoURL}/><AvatarFallback>{p.displayName?.[0]}</AvatarFallback></Avatar><span className="font-medium">{p.displayName}</span></div>
                                            </TableCell>
                                            <TableCell>{p.email}</TableCell>
                                            <TableCell>{(p as any).joinedAt ? format((p as any).joinedAt.toDate(), 'PPpp') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setActionToConfirm({ type: 'removePlayer', playerId: p.uid })} disabled={isSubmitting || tournament.status !== 'upcoming'}><UserX className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No players have registered yet.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="status" className="text-sm font-medium">Change Status</Label>
                                <Select defaultValue={tournament.status} onValueChange={(v) => handleStatusChange(v as Tournament['status'])} disabled={isSubmitting}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button variant="outline" className="w-full" onClick={() => setIsEditOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</Button>
                             <Button variant="destructive" className="w-full" onClick={() => setActionToConfirm('cancel')} disabled={tournament.status === 'cancelled'}><X className="mr-2 h-4 w-4" /> Cancel Tournament</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionToConfirm === 'cancel' 
                                ? "This action will cancel the tournament and refund the entry fee to all registered players. This cannot be undone."
                                : "This will remove the player from the tournament and refund their entry fee. This cannot be undone."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAction} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isSubmitting ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
