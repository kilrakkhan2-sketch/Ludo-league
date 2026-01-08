
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match, MatchResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Eye,
  Users,
  XCircle,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trophy,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useSearchParams, useRouter } from 'next/navigation';
import NoSsr from '@/components/NoSsr';

function AdminMatchesPageContent() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const matchesRef = collection(firestore, 'matches');
    const q = query(matchesRef, orderBy('createdAt', 'desc')); // Fetch all matches for admin
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Match)
      );
      setAllMatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const matchesByStatus = (status: Match['status']) =>
    allMatches.filter((match) => match.status === status);

  const MatchTable = ({
    matches,
    title,
    description,
  }: {
    matches: Match[];
    title: string;
    description: string;
  }) => (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Match ID</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                <TableRow>
                    <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                    >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                </TableRow>
                )}
                {!loading &&
                matches.map((match) => (
                    <TableRow key={match.id}>
                    <TableCell className="font-mono text-xs">{match.id}</TableCell>
                    <TableCell>₹{match.prizePool}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {match.playerIds.length} / {match.maxPlayers}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge
                        variant={
                            match.status === 'completed'
                            ? 'outline'
                            : match.status === 'disputed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={cn({
                            'text-blue-600 border-blue-600 bg-blue-50':
                            match.status === 'in-progress',
                            'text-green-600 border-green-600 bg-green-50':
                            match.status === 'completed',
                        })}
                        >
                        {match.status.charAt(0).toUpperCase() +
                            match.status.slice(1)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/matches/${match.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Match
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                {!loading && matches.length === 0 && (
                <TableRow>
                    <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                    >
                    No {title.toLowerCase()} found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Match Management
        </h2>
      </div>
      <Tabs defaultValue="disputed" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
        </TabsList>
        <TabsContent value="disputed" className="mt-4">
          <MatchTable matches={matchesByStatus('disputed')} title="Disputed Matches" description="Matches where player submissions conflict. Manual review required."/>
        </TabsContent>
        <TabsContent value="in-progress" className="mt-4">
          <MatchTable matches={matchesByStatus('in-progress')} title="In-Progress Matches" description="Matches that have started but results are not yet fully submitted."/>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <MatchTable matches={matchesByStatus('completed')} title="Completed Matches" description="Matches that have finished and are awaiting prize distribution or are finalized."/>
        </TabsContent>
        <TabsContent value="waiting" className="mt-4">
          <MatchTable matches={matchesByStatus('waiting')} title="Waiting Matches" description="Matches waiting for more players to join." />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function AdminMatchesPage() {
    return (
        <React.Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}>
            <AdminMatchesPageContent />
        </React.Suspense>
    )
}
