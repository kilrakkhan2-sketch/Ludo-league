'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useUser } from '@/firebase';
import { Tournament, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'upcoming': return 'secondary';
    case 'live': return 'destructive';
    case 'completed': return 'outline';
    default: return 'default';
  }
};

const UserCell = ({ userId }: { userId: string }) => {
    const { data: user, loading } = useCollection<UserProfile>('users', { where: ['uid', '==', userId], limit: 1 });
    if (loading) return <Skeleton className="h-5 w-24" />;
    return <>{user[0]?.displayName || 'Unknown Admin'}</>;
}


export default function AdminTournamentsPage() {
  const { data: tournaments, loading } = useCollection<Tournament>('tournaments', {
    orderBy: ['startDate', 'desc'],
  });

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Manage Tournaments</h1>
             <Button asChild>
                <Link href="/admin/tournaments/create"><PlusCircle className="mr-2 h-4 w-4" />Create Tournament</Link>
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry / Prize</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading tournaments...</TableCell></TableRow>
                ) : tournaments.length === 0 ? (
                   <TableRow><TableCell colSpan={6} className="text-center h-24">No tournaments created yet.</TableCell></TableRow>
                ) : tournaments.map((t: Tournament) => {
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                       <TableCell>₹{t.entryFee} / ₹{t.prizePool}</TableCell>
                       <TableCell>{t.players.length} / {t.maxPlayers}</TableCell>
                      <TableCell>{t.startDate ? format((t.startDate as any).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>Manage</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
           </CardContent>
        </Card>
      </div>
  );
}
