
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection, useUser, useDoc } from '@/firebase';
import { Tournament, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Users, Award, Calendar } from 'lucide-react';
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
    const { data: user, loading } = useDoc<UserProfile>(`users/${userId}`);
    if (loading) return <Skeleton className="h-5 w-24" />;
    return <>{user?.displayName || 'Unknown Admin'}</>;
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
        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        ) : tournaments.length === 0 ? (
           <div className="text-center py-12">
                <p className="text-muted-foreground">No tournaments created yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((t: Tournament) => (
                    <Card key={t.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{t.name}</CardTitle>
                                <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                           <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Award className="h-4 w-4" /> Prize Pool</span>
                                <span className="font-semibold">₹{t.prizePool}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Entry Fee</span>
                                <span className="font-semibold">₹{t.entryFee}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Players</span>
                                <span className="font-semibold">{t.players.length} / {t.maxPlayers}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Starts</span>
                                <span className="font-semibold">{t.startDate ? format((t.startDate as any).toDate(), 'dd MMM yyyy') : 'N/A'}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" disabled>Manage</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
      </div>
  );
}
