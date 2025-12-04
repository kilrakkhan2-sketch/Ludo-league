
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/firebase";
import type { Match } from "@/types";
import { format } from "date-fns";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton";


const statusColors: { [key in Match['status']]: string } = {
  open: "bg-blue-500/20 text-blue-700 border-blue-500/20",
  ongoing: "bg-yellow-500/20 text-yellow-700 border-yellow-500/20",
  completed: "bg-green-500/20 text-green-700 border-green-500/20",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/20",
  verification: "bg-purple-500/20 text-purple-700 border-purple-500/20",
};


export default function AdminMatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Match['status'] | 'all'>('all');
  
  const queryOptions = {
    orderBy: ['createdAt', 'desc'] as [string, "asc" | "desc"],
    limit: 15,
    where: statusFilter !== 'all' ? ['status', '==', statusFilter] as const : undefined,
  };
  
  const { data: matches, loading, hasMore, loadMore } = useCollection<Match>('matches', queryOptions);

  const filteredMatches = matches
    .filter(match => 
        match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.creatorId.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Match Management</h1>
       <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>
            Oversee and manage all matches on the platform.
          </CardDescription>
          <div className="pt-4 flex gap-4">
             <Input 
                placeholder="Search by title, ID, creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
             />
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Match['status'] | 'all')}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
           {loading && filteredMatches.length === 0 ? <TableSkeleton /> : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Entry Fee</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredMatches.length > 0 ? filteredMatches.map(match => (
                        <TableRow key={match.id}>
                            <TableCell>
                                <div className="font-medium">{match.title}</div>
                                <div className="text-xs text-muted-foreground font-mono">{match.id}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusColors[match.status]}>
                                    {match.status}
                                </Badge>
                            </TableCell>
                            <TableCell>₹{match.entryFee}</TableCell>
                            <TableCell>{match.players.length} / {match.maxPlayers}</TableCell>
                            <TableCell>{match.createdAt?.seconds ? format(new Date(match.createdAt.seconds * 1000), 'dd MMM, yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/match/${match.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                                No matches found with the current filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
           )}
          {hasMore && (
            <div className="pt-4 flex justify-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
