
'use client';

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/firebase";
import type { Match } from "@/types";
import { format } from "date-fns";
import Link from "next/link";


export default function AdminResultsPage() {
  const { data: verificationMatches, loading } = useCollection<Match>('matches', { 
    filter: { field: 'status', operator: '==', value: 'verification' },
    sort: { field: 'createdAt', direction: 'asc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Result Verification</h1>
       <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Verify match results submitted by players to distribute prizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading matches...</p> : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Match Title</TableHead>
                        <TableHead>Prize Pool</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {verificationMatches.length > 0 ? verificationMatches.map(match => (
                        <TableRow key={match.id}>
                            <TableCell>
                                <div className="font-medium">{match.title}</div>
                                <div className="text-xs text-muted-foreground font-mono">{match.id}</div>
                            </TableCell>
                             <TableCell className="font-semibold text-green-600">
                                ₹{(match.entryFee * match.players.length) * 0.9}
                            </TableCell>
                            <TableCell>{match.players.length} / {match.maxPlayers}</TableCell>
                            <TableCell>{format(new Date(match.createdAt), 'dd MMM, yyyy HH:mm')}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild size="sm">
                                    <Link href={`/admin/results/${match.id}`}>Verify Result</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No matches are currently awaiting result verification.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
