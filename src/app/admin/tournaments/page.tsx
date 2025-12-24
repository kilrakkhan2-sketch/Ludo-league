'use client';

import Link from "next/link";
import { useCollection } from "@/firebase";
import { Tournament } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowRight } from "lucide-react";

// Helper to determine badge variant based on status
const getBadgeVariant = (status: Tournament['status']) => {
  switch (status) {
    case 'upcoming': return 'secondary';
    case 'ongoing': return 'destructive';
    case 'completed': return 'outline';
    default: return 'default';
  }
};

export default function TournamentsPage() {
  const { data: tournaments, loading } = useCollection<Tournament>('tournaments');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground">Manage all tournaments on the platform.</p>
        </div>
        <Button asChild>
          <Link href="/admin/tournaments/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Entry Fee</TableHead>
              <TableHead>Prize Pool</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading tournaments...
                </TableCell>
              </TableRow>
            ) : tournaments && tournaments.length > 0 ? (
              tournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.game}</TableCell>
                  <TableCell>₹{t.entryFee}</TableCell>
                  <TableCell>₹{t.prizePool}</TableCell>
                  <TableCell>{t.registeredPlayers}/{t.maxPlayers}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(t.status)} className="capitalize">{t.status}</Badge>
                  </TableCell>
                  <TableCell>{t.startTime ? new Date(t.startTime.seconds * 1000).toLocaleString() : 'Not set'}</TableCell>
                  <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/tournaments/${t.id}`}>Manage <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No tournaments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
