
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useDoc } from '@/firebase';
import { Tournament, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Users, Award, Calendar, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const getStatusVariant = (status: Tournament['status']) => {
  switch (status) {
    case 'upcoming': return 'secondary';
    case 'live': return 'destructive';
    case 'completed': return 'outline';
    default: return 'default';
  }
};

const CreatorCell = ({ uid }: { uid: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${uid}`);
    if (loading) return <Skeleton className="h-5 w-24" />;
    return <span className="font-medium">{user?.displayName || 'Unknown'}</span>;
}

export default function AdminTournamentsPage() {
  const { data: tournaments, loading, refetch } = useCollection<Tournament>('tournaments', { orderBy: ['startDate', 'desc'] });
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [deleteAlert, setDeleteAlert] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!firestore || !deleteAlert) return;
    await deleteDoc(doc(firestore, "tournaments", deleteAlert));
    toast({ title: "Tournament Deleted" });
    setDeleteAlert(null);
    refetch();
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Tournament Control Center</h1>
                <p className="text-muted-foreground">Manage all upcoming, live, and completed tournaments.</p>
            </div>
             <Button asChild>
                <Link href="/admin/tournaments/create"><PlusCircle className="mr-2 h-4 w-4" />Create Tournament</Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader><CardTitle>All Tournaments</CardTitle></CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tournament</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Prize / Entry</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Starts On</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && [...Array(5)].map((_, i) => <TableRow key={i}>{Array(7).fill(0).map((_, c) => <TableCell key={c}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>)}
                        {!loading && tournaments.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center">No tournaments found.</TableCell></TableRow>}
                        {!loading && tournaments.map((t: Tournament) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.name}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                                <TableCell>₹{t.prizePool} / ₹{t.entryFee}</TableCell>
                                <TableCell>{t.players.length} / {t.maxPlayers}</TableCell>
                                <TableCell>{t.startDate ? format((t.startDate as any).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                <TableCell><CreatorCell uid={t.creatorId} /></TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            {/* <DropdownMenuItem>Edit</DropdownMenuItem> */}
                                            <DropdownMenuItem onClick={() => setDeleteAlert(t.id)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         <AlertDialog open={!!deleteAlert} onOpenChange={(isOpen) => !isOpen && setDeleteAlert(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the tournament and all its data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
