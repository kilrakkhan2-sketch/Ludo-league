
'use client';

import { useState, useMemo } from 'react';
import { AdminShell } from "@/components/layout/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/firebase";
import { Match } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const matchStatuses = ['all', 'open', 'in-progress', 'completed', 'disputed', 'cancelled'];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'secondary';
    case 'in-progress': return 'default';
    case 'completed': return 'success';
    case 'disputed': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'default';
  }
};


const MatchRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-10 w-20" /></TableCell>
    </TableRow>
);

export default function AdminMatchesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: matches, loading } = useCollection<Match>('matches', { 
      orderBy: [['createdAt', 'desc']],
      where: statusFilter !== 'all' ? ['status', '==', statusFilter] : undefined
    });

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(match => 
        match.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  return (
    <AdminShell pageTitle="Matches">
        <Card>
            <CardHeader>
                <CardTitle>Manage Matches</CardTitle>
                <div className="flex items-center justify-between pt-4">
                    <div className="flex space-x-2">
                        {matchStatuses.map(status => (
                            <Button key={status} size="sm" variant={statusFilter === status ? 'default' : 'outline'} onClick={() => setStatusFilter(status)} className="capitalize">
                                {status}
                            </Button>
                        ))}
                    </div>
                    <div className="w-1/3">
                        <Input 
                            placeholder='Search by title...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Entry Fee</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Prize</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <>
                                <MatchRowSkeleton />
                                <MatchRowSkeleton />
                                <MatchRowSkeleton />
                                <MatchRowSkeleton />
                            </>
                        )}
                        {!loading && filteredMatches.map(match => (
                            <TableRow key={match.id}>
                                <TableCell>{match.title}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status}</Badge></TableCell>
                                <TableCell>₹{match.entryFee}</TableCell>
                                <TableCell>{match.players.length} / {match.maxPlayers}</TableCell>
                                <TableCell>₹{match.prizePool}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/matches/${match.id}`}>Manage</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </AdminShell>
  );
}
