
'use client';

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockMatches, type Match, type MatchResult } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Crown, Eye, Users, XCircle, Shield, HandCoins, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MatchDetailDialog = ({ match: initialMatch }: { match: Match }) => {
  const [match, setMatch] = useState(initialMatch);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const winner = match.results ? match.players.find(p => p.id === match.results?.find(r => r.status === 'win')?.userId) : null;
  
  const handleDeclareWinner = (winnerId: string) => {
    setIsProcessing(true);
    toast({
        title: "Processing...",
        description: `Declaring ${match.players.find(p => p.id === winnerId)?.name} as the winner.`,
    });
    // Simulate API call
    setTimeout(() => {
        const newResults = match.results?.map(r => {
            if (r.userId === winnerId) {
                return { ...r, status: 'win', position: 1 };
            }
            return { ...r, status: 'loss', position: r.position > 1 ? r.position : 2 };
        }) as MatchResult[];

        setMatch({
            ...match,
            status: 'completed',
            results: newResults,
        });
        setIsProcessing(false);
        toast({
            title: "Winner Declared!",
            description: "Payouts have been processed.",
            variant: 'default',
            className: 'bg-green-100 text-green-800'
        });
    }, 1000);
  };
  
  const handleAction = (action: string) => {
    toast({
        title: "Action Triggered",
        description: `The action "${action}" has been initiated for match ${match.id}.`,
    })
  }

  return (
    <Dialog onOpenChange={(open) => !open && setMatch(initialMatch)}>
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
            Prize Pool: ₹{match.prizePool} | Status:{" "}
            <span
              className={cn("font-semibold", {
                "text-green-600": match.status === "completed",
                "text-blue-600": match.status === "in-progress",
                "text-yellow-600": match.status === "waiting",
                "text-red-600": match.status === "disputed",
              })}
            >
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
            {winner && match.status === 'completed' && ` | Winner: ${winner.name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[70vh] overflow-y-auto p-1">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Player Submissions</h4>
            {match.results && match.results.length > 0 ? (
                match.results?.map((result, index) => {
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
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={player?.avatarUrl} />
                        <AvatarFallback>
                          {player?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-base">{player?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          User ID: {player?.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <Crown
                          className={cn(
                            "h-5 w-5",
                            result.position === 1
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                          )}
                        />
                        Position: {result.position}
                      </div>
                      <Badge
                        variant={
                          result.status === "win" ? "default" : "destructive"
                        }
                        className={cn({ "bg-green-500 hover:bg-green-600": result.status === "win" })}
                      >
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </Badge>
                    </div>
                    {match.status === 'disputed' && (
                        <Button size="sm" className="w-full text-green-50 bg-green-600 hover:bg-green-700" onClick={() => handleDeclareWinner(result.userId)} disabled={isProcessing}>
                            <CheckCircle2 className="h-4 w-4 mr-2"/> Declare {player?.name} as Winner
                        </Button>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                     <p className="text-sm font-medium self-start">Submitted Screenshot</p>
                    <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Image
                            src={result.screenshotUrl}
                            alt={`Screenshot from ${player?.name}`}
                            width={300}
                            height={200}
                            className="rounded-md object-cover border-2 w-full h-auto"
                        />
                    </a>
                  </div>
                </div>
              );
            })
            ) : <p className="text-muted-foreground text-center py-4">No results have been submitted for this match yet.</p>
            }
          </div>
        </div>
         <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
            {match.status === 'disputed' && (
                 <Button variant="outline" className="text-orange-500 border-orange-500 hover:bg-orange-100 hover:text-orange-600" onClick={() => handleAction('Resolve Dispute')}>
                    <AlertTriangle className="mr-2 h-4 w-4"/> Mark as Resolved
                </Button>
            )}
            <Button variant="outline" onClick={() => handleAction('View Fraud Report')}><Shield className="mr-2 h-4 w-4"/> View Fraud Report</Button>
            <Button variant="secondary" onClick={() => handleAction('Refund Select Players')}><HandCoins className="mr-2 h-4 w-4"/> Refund Players</Button>
            <Button variant="destructive" onClick={() => handleAction('Cancel Match')}><XCircle className="mr-2 h-4 w-4"/> Cancel Match</Button>
            <Button variant="destructive" className="bg-red-800 hover:bg-red-900" onClick={() => handleAction('Ban User')}><Ban className="mr-2 h-4 w-4"/> Ban User</Button>
            <DialogClose asChild>
                <Button variant="ghost">Close</Button>
            </DialogClose>
         </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminMatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[]>(mockMatches);

  const matchesByStatus = (status: Match["status"]) =>
    allMatches.filter((match) => match.status === status);

  const MatchTable = ({ status }: { status: Match["status"] }) => (
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
        {matchesByStatus(status).map((match) => (
          <TableRow key={match.id}>
            <TableCell className="font-mono text-xs">{match.id}</TableCell>
            <TableCell>₹{match.prizePool}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {match.players.length} / {match.maxPlayers}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  match.status === "completed"
                    ? "outline"
                    : match.status === "disputed"
                    ? "destructive"
                    : "secondary"
                }
                className={cn({
                    "text-blue-600 border-blue-600": match.status === 'in-progress',
                    "text-green-600 border-green-600": match.status === 'completed',
                })}
              >
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
                <MatchDetailDialog match={match} />
            </TableCell>
          </TableRow>
        ))}
        {matchesByStatus(status).length === 0 && (
            <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No {status} matches found.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Match Management
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>
            Review and manage all ongoing, completed, and disputed matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disputed" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="waiting">Waiting</TabsTrigger>
            </TabsList>
            <TabsContent value="in-progress" className="mt-4">
              <MatchTable status="in-progress" />
            </TabsContent>
             <TabsContent value="disputed" className="mt-4">
                <MatchTable status="disputed" />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <MatchTable status="completed" />
            </TabsContent>
            <TabsContent value="waiting" className="mt-4">
                <MatchTable status="waiting" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
