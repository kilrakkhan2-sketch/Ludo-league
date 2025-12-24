
'use client';

import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection, useDoc } from "@/firebase";
import { Match, UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, AlertTriangle, ArrowRight, Swords } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const matchStatuses = ['result_submitted', 'disputed', 'game_started', 'waiting', 'completed', 'cancelled', 'all'];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'disputed': return 'destructive';
    case 'result_submitted':
    case 'verification': return 'secondary';
    case 'completed':
    case 'PAID':
         return 'default';
    default: return 'outline';
  }
};

const UserDisplay = ({ uid }: { uid: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${uid}`);
    if (loading) return <Skeleton className="h-4 w-20" />;
    return <span className="font-medium truncate">{user?.displayName || uid}</span>;
}

export default function AdminMatchesPage() {
  const [statusFilter, setStatusFilter] = useState('result_submitted');
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: statusFilter !== 'all' ? ['status', '==', statusFilter] as const : undefined,
    limit: 100
  }), [statusFilter]);
  
  const { data: matches, loading } = useCollection<Match>('matches', queryOptions);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return matches;
    return matches.filter(match => 
        match.title?.toLowerCase().includes(lowerSearch) || 
        match.id.toLowerCase().includes(lowerSearch) ||
        match.players.some(p => p.toLowerCase().includes(lowerSearch))
    );
  }, [matches, searchTerm]);

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">Match Management</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Review Matches</CardTitle>
                <CardDescription>
                    Browse and manage all matches. Default view shows matches needing result verification.
                </CardDescription>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex space-x-2 overflow-x-auto pb-2 w-full">
                        {matchStatuses.map(status => (
                            <Button key={status} size="sm" variant={statusFilter === status ? 'default' : 'outline'} onClick={() => setStatusFilter(status)} className="capitalize shrink-0">
                                {status.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                    <div className="w-full sm:w-auto sm:max-w-xs">
                        <Input 
                            placeholder='Search by title, ID, or player ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>Match</TableHead>
                                <TableHead>Players</TableHead>
                                <TableHead className="hidden md:table-cell">Entry / Prize</TableHead>
                                <TableHead className="hidden lg:table-cell">Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && [...Array(5)].map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, c) => <TableCell key={c}><Skeleton className="h-8 w-full" /></TableCell>)}</TableRow>)}
                            {!loading && filteredMatches.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No matches found for "{statusFilter}".</TableCell></TableRow>}
                            {!loading && filteredMatches.map(match => (
                                <TableRow key={match.id} className={match.status === 'disputed' ? 'bg-destructive/10' : ''}>
                                    <TableCell>
                                        <div className="font-medium truncate">{match.title}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{match.id}</div>
                                    </TableCell>
                                    <TableCell>
                                         <div className="flex items-center gap-2">
                                            {match.players?.[0] && <UserDisplay uid={match.players[0]} />}
                                            {match.players?.length > 1 && <Swords className="h-4 w-4 text-muted-foreground" />}
                                            {match.players?.[1] && <UserDisplay uid={match.players[1]} />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div><span className="text-muted-foreground">Fee:</span> ₹{match.entryFee}</div>
                                        <div><span className="text-muted-foreground">Prize:</span> ₹{match.prizePool}</div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm">
                                        {match.createdAt ? formatDistanceToNow((match.createdAt as any).toDate(), { addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status.replace(/_/g, ' ')}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/matches/${match.id}`}>
                                                {statusFilter === 'result_submitted' || statusFilter === 'disputed' ? 'Review' : 'View'} <ArrowRight className="ml-2 h-4 w-4"/>
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
