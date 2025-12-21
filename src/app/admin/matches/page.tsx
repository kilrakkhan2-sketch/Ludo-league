
'use client';

import { useState, useMemo } from 'react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Trophy } from 'lucide-react';

const matchStatuses = ['all', 'open', 'ongoing', 'processing', 'verification', 'disputed', 'completed', 'cancelled'];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'secondary';
    case 'ongoing': return 'default';
    case 'processing': return 'default';
    case 'verification': return 'destructive';
    case 'completed': return 'outline';
    case 'disputed': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'default';
  }
};


export default function AdminMatchesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'],
    where: statusFilter !== 'all' ? ['status', '==', statusFilter] : undefined
  }), [statusFilter]);
  
  const { data: matches, loading } = useCollection<Match>('matches', queryOptions);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(match => 
        (match.title?.toLowerCase().includes(searchTerm.toLowerCase()) || match.id.includes(searchTerm))
    );
  }, [matches, searchTerm]);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Matches</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Manage Matches</CardTitle>
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
                            placeholder='Search by title or ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : filteredMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredMatches.map(match => (
                            <Card key={match.id}>
                                <CardHeader>
                                    <div className='flex justify-between items-start'>
                                        <CardTitle className="truncate">{match.title}</CardTitle>
                                        <Badge variant={getStatusVariant(match.status)} className="capitalize">{match.status.replace('_', ' ')}</Badge>
                                    </div>
                                    <CardDescription className="font-mono text-xs truncate">{match.id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Entry:</span>
                                        <span className="font-semibold">₹{match.entryFee}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Prize:</span>
                                        <span className="font-semibold">₹{match.prizePool}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{match.players.length} / {match.maxPlayers} Players</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/admin/matches/${match.id}`}>Manage Match</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No {statusFilter} matches found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
