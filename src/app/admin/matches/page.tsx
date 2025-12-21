
'use client';

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
  const { data: matches, loading } = useCollection<Match>('matches', { orderBy: [['createdAt', 'desc']] });

  return (
    <AdminShell pageTitle="Matches">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Prize</TableHead>
                    <TableHead>Actions</TableHead>
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
                {!loading && matches.map(match => (
                    <TableRow key={match.id}>
                        <TableCell>{match.title}</TableCell>
                        <TableCell><Badge variant={match.status === 'open' ? 'secondary' : 'default'}>{match.status}</Badge></TableCell>
                        <TableCell>₹{match.entryFee}</TableCell>
                        <TableCell>{match.players.length} / {match.maxPlayers}</TableCell>
                        <TableCell>₹{match.prizePool}</TableCell>
                        <TableCell>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/match/${match.id}`}>View</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </AdminShell>
  );
}
