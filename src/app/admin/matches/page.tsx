
'use client';

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { mockMatches, type Match } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Crown, Eye, Users, XCircle, Shield, HandCoins } from "lucide-react";
import { useState } from "react";

const MatchDetailDialog = ({ match }: { match: Match }) => {
  const winner = match.results ? match.players.find(p => p.id === match.results?.find(r => r.position === 1)?.userId) : null;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Match Details: {match.id}</DialogTitle>
          <DialogDescription>
            Prize Pool: ₹{match.prizePool} | Status:{" "}
            <span
              className={cn("font-semibold", {
                "text-green-600": match.status === "completed",
                "text-blue-600": match.status === "in-progress",
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
            {match.results?.map((result, index) => {
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
                        className={cn({ "bg-green-500/80": result.status === "win" })}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                     <p className="text-sm font-medium mb-2 self-start">Submitted Screenshot</p>
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
            })}
             {!match.results && <p className="text-muted-foreground text-center py-4">No results have been submitted for this match yet.</p>}
          </div>
        </div>
         <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline"><Shield className="mr-2 h-4 w-4"/> View Fraud Report</Button>
            <Button variant="secondary"><HandCoins className="mr-2 h-4 w-4"/> Refund Entry Fees</Button>
            <Button variant="destructive"><XCircle className="mr-2 h-4 w-4"/> Cancel Match</Button>
         </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminMatchesPage() {
  const matchesByStatus = (status: Match["status"]) =>
    mockMatches.filter((match) => match.status === status);

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
                    "text-blue-600 border-blue-600": match.status === 'in-progress'
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
          <Tabs defaultValue="in-progress">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
            </TabsList>
            <TabsContent value="in-progress" className="mt-4">
              <MatchTable status="in-progress" />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <MatchTable status="completed" />
            </TabsContent>
            <TabsContent value="disputed" className="mt-4">
                <MatchTable status="disputed" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
