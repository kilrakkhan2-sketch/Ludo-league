
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
  Crown,
  Eye,
  Users,
  XCircle,
  Shield,
  HandCoins,
  CheckCircle2,
  AlertTriangle,
  Ban,
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
  where,
  doc,
  runTransaction,
  getDocs,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { distributeWinnings } from '@/ai/flows/distribute-winnings';
import { useSearchParams } from 'next/navigation';
import NoSsr from '@/components/NoSsr';

const MatchDetailDialog = ({
  match: initialMatch,
  onUpdate,
  startOpen = false,
  onOpenChange,
}: {
  match: Match;
  onUpdate: (updatedMatch: Match) => void;
  startOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [match, setMatch] = useState(initialMatch);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Use string to track which player is being processed
  const [isDistributing, setIsDistributing] = useState(false);
  const [isOpen, setIsOpen] = useState(startOpen);

  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    setMatch(initialMatch); // Keep local state in sync with prop
  }, [initialMatch]);
  
  useEffect(() => {
    setIsOpen(startOpen);
  }, [startOpen]);

  useEffect(() => {
    if (!firestore || !isOpen) return;
    const resultsRef = collection(firestore, `matches/${match.id}/results`);
    const q = query(resultsRef, orderBy('position', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resultsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MatchResult)
      );
      setResults(resultsData);
    });
    return () => unsubscribe();
  }, [firestore, match.id, isOpen]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  }

  const winnerPlayer = match.winnerId ? match.players.find((p) => p.id === match.winnerId) : null;

  const handleDeclareWinner = async (winnerId: string) => {
    if (!firestore) return;
    setIsProcessing(winnerId);
    const winnerPlayerInfo = match.players.find((p) => p.id === winnerId);
    toast({
      title: 'Processing...',
      description: `Declaring ${winnerPlayerInfo?.name || 'player'} as the winner.`,
    });

    try {
      const matchRef = doc(firestore, 'matches', match.id);
      await updateDoc(matchRef, { status: 'completed', winnerId: winnerId });

      const updatedMatch = { ...match, status: 'completed', winnerId: winnerId } as Match;
      setMatch(updatedMatch);
      onUpdate(updatedMatch);

      toast({
        title: 'Winner Declared!',
        description: `${winnerPlayerInfo?.name || 'Player'} is now the winner. You can now distribute the prize.`,
        variant: 'default',
        className: 'bg-green-100 text-green-800',
      });
    } catch (error: any) {
      toast({
        title: 'Error Declaring Winner',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDistributeWinnings = async () => {
    if (!match.winnerId) {
       toast({
        title: 'No winner declared for this match.',
        variant: 'destructive',
      });
      return;
    }
    const winnerPlayerInfo = match.players.find(p => p.id === match.winnerId);
    
    setIsDistributing(true);
    toast({ title: "Distributing winnings...", description: `Processing payment for ${winnerPlayerInfo?.name || 'the winner'}`});

    try {
      const result = await distributeWinnings({
        matchId: match.id,
      });
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          className: 'bg-green-100 text-green-800',
        });
        const updatedMatch = { ...match, prizeDistributed: true } as Match;
        setMatch(updatedMatch); // Update local state
        onUpdate(updatedMatch); // Update parent state
      } else {
        toast({
          title: 'Distribution Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const handleAction = (action: string) => {
    toast({
      title: 'Action Triggered',
      description: `The action "${action}" has been initiated for match ${match.id}.`,
    });
  };

  return (
    <NoSsr>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Review Match
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Match: {match.id}</DialogTitle>
            <DialogDescription>
              Prize Pool: ₹{match.prizePool} | Status:{' '}
              <span
                className={cn('font-semibold', {
                  'text-green-600': match.status === 'completed',
                  'text-blue-600': match.status === 'in-progress',
                  'text-yellow-600': match.status === 'waiting',
                  'text-red-600': match.status === 'disputed',
                })}
              >
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </span>
              {winnerPlayer &&
                ` | Winner: ${winnerPlayer.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Player Submissions</h4>
              {results && results.length > 0 ? (
                results.map((result, index) => {
                  const player = match.players.find(
                    (p) => p.id === result.userId
                  );
                  return (
                    <div
                      key={index}
                      className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border">
                            <AvatarImage src={(player as any)?.avatarUrl} />
                            <AvatarFallback>
                              {(player as any)?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-base">
                              {(player as any)?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              User ID: {(player as any)?.id.substring(0, 10)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-lg font-bold">
                            <Trophy
                              className={cn(
                                'h-5 w-5',
                                result.position === 1
                                  ? 'text-yellow-500'
                                  : 'text-muted-foreground'
                              )}
                            />
                            Position: {result.position}
                          </div>
                           {result.isFlaggedForFraud && <Badge variant="destructive">Flagged</Badge>}
                        </div>
                        {['disputed', 'in-progress'].includes(match.status) && (
                          <Button
                            size="sm"
                            className="w-full text-green-50 bg-green-600 hover:bg-green-700"
                            onClick={() => handleDeclareWinner(result.userId)}
                            disabled={!!isProcessing}
                          >
                            {isProcessing === result.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}{' '}
                            Declare {(player as any)?.name} as Winner
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm font-medium self-start">
                          Submitted Screenshot
                        </p>
                        <a
                          href={result.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <Image
                            src={result.screenshotUrl}
                            alt={`Screenshot from ${(player as any)?.name}`}
                            width={300}
                            height={200}
                            className="rounded-md object-contain border-2 w-full h-auto"
                          />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No results have been submitted for this match yet.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
            {match.status === 'completed' &&
              !match.prizeDistributed &&
              match.winnerId && (
                <Button
                  variant="accent"
                  onClick={handleDistributeWinnings}
                  disabled={isDistributing}
                >
                  {isDistributing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HandCoins className="mr-2 h-4 w-4" />
                  )}{' '}
                  Distribute Prize to {winnerPlayer?.name}
                </Button>
              )}
            {match.prizeDistributed && (
              <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Winnings already distributed.
              </p>
            )}
            {match.status === 'disputed' && (
               <DialogClose asChild>
                  <Button
                  variant="outline"
                  className="text-orange-500 border-orange-500 hover:bg-orange-100 hover:text-orange-600"
                  onClick={() => handleAction('Resolve Dispute')}
                  >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Manually Resolved
                  </Button>
              </DialogClose>
            )}
            <Button variant="outline" onClick={() => handleAction('View Fraud Report')}>
              <Shield className="mr-2 h-4 w-4" /> View Fraud Report
            </Button>
            <Button variant="destructive" onClick={() => handleAction('Cancel Match')}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel Match
            </Button>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </NoSsr>
  );
};

function AdminMatchesPageContent() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const matchIdToOpen = searchParams.get('matchId');
  const [openMatch, setOpenMatch] = useState<Match | null>(null);

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

  useEffect(() => {
    if (matchIdToOpen && allMatches.length > 0) {
      const matchToOpen = allMatches.find(m => m.id === matchIdToOpen);
      if (matchToOpen) {
        setOpenMatch(matchToOpen);
      }
    }
  }, [matchIdToOpen, allMatches]);

  const handleMatchUpdate = (updatedMatch: Match) => {
    setAllMatches((prevMatches) =>
      prevMatches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
    );
     if (openMatch && openMatch.id === updatedMatch.id) {
      setOpenMatch(updatedMatch);
    }
  };

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
                    <MatchDetailDialog
                      match={match}
                      onUpdate={handleMatchUpdate}
                    />
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
      {openMatch && (
         <MatchDetailDialog 
            match={openMatch} 
            onUpdate={handleMatchUpdate} 
            startOpen={true}
            onOpenChange={(open) => !open && setOpenMatch(null)}
        />
      )}
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

    