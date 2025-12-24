
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
import { Users, AlertTriangle } from 'lucide-react';

// Updated statuses for the new system
const matchStatuses = ['FLAGGED', 'AUTO_VERIFIED', 'PAID', 'completed', 'disputed', 'cancelled', 'all'];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'FLAGGED':
    case 'disputed':
        return 'destructive';
    case 'PAID':
    case 'completed':
        return 'outline';
    case 'AUTO_VERIFIED':
        return 'default';
    case 'cancelled':
        return 'secondary';
    default: 
        return 'default';
  }
};


export default function AdminMatchesPage() {
  // Default filter is now 'FLAGGED'
  const [statusFilter, setStatusFilter] = useState('FLAGGED');
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryOptions = useMemo(() => ({
    orderBy: ['createdAt', 'desc'] as const,
    where: statusFilter !== 'all' ? ['status', '==', statusFilter] as const : undefined,
    limit: 50
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
        <h1 className="text-3xl font-bold font-headline">Match Management</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Review Matches</CardTitle>
                <CardDescription>
                    {statusFilter === 'FLAGGED' 
                        ? 'Showing all matches that require manual review due to detected fraud.' 
                        : 'Browse all matches by status.'}
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
                            placeholder='Search by title or ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                ) : filteredMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMatches.map(match => (
                            <Card key={match.id} className={match.status === 'FLAGGED' ? 'border-destructive' : ''}>
                                <CardHeader>
                                    <div className='flex justify-between items-start gap-2'>
                                        <CardTitle className="truncate text-base">{match.title}</CardTitle>
                                        <Badge variant={getStatusVariant(match.status)} className="capitalize shrink-0">{match.status.replace('_', ' ')}</Badge>
                                    </div>
                                    <CardDescription className="font-mono text-xs truncate pt-1">{match.id}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Entry: ₹{match.entryFee}</span>
                                        <span className="font-semibold">Prize: ₹{match.prizePool}</span>
                                    </div>
                                    
                                    {/* Display Fraud Reasons */}
                                    {match.fraudReasons && match.fraudReasons.length > 0 && (
                                        <div className='p-2 bg-destructive/10 rounded-md'>
                                            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5"><AlertTriangle className='h-3 w-3'/> Fraud Flags</p>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {match.fraudReasons.map((reason, index) => (
                                                    <Badge key={index} variant="destructive" className='text-xs'>{reason.replace(/_/g, ' ')}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/admin/matches/${match.id}`}>
                                          {match.status === 'FLAGGED' ? 'Review & Action' : 'View Details'}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold">No Matches Found</h3>
                        <p className="text-muted-foreground mt-1">There are no matches with the status "{statusFilter}".</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
