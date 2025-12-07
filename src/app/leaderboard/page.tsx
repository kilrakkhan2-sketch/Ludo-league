"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { useCollection } from "@/firebase";
import { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <Badge className="bg-yellow-400 text-black w-8 h-8 flex items-center justify-center text-sm font-bold">
        <Trophy className="w-4 h-4" />
      </Badge>
    );
  if (rank === 2) return <Badge className="bg-slate-400 text-white w-8 h-8 flex items-center justify-center text-sm font-bold">{rank}</Badge>;
  if (rank === 3) return <Badge className="bg-orange-500 text-white w-8 h-8 flex items-center justify-center text-sm font-bold">{rank}</Badge>;
  return <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center text-sm font-bold">{rank}</Badge>;
}

const PlayerRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-24" />
            </div>
        </TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
    </TableRow>
)

export default function LeaderboardPage() {
    const {data: players, loading} = useCollection<UserProfile>('users', {
        orderBy: ['rating', 'desc'],
        limit: 100,
    });

    const sortedPlayers = players.sort((a,b) => (b.rating || 0) - (a.rating || 0))
        .map((p, i) => ({...p, rank: i + 1}));

  return (
    <AppShell>
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold font-headline">Leaderboard</h1>
        <div className="rounded-xl overflow-hidden shadow-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <>
                        <PlayerRowSkeleton />
                        <PlayerRowSkeleton />
                        <PlayerRowSkeleton />
                        <PlayerRowSkeleton />
                        <PlayerRowSkeleton />
                    </>
                ) : sortedPlayers.map((player) => (
                  <TableRow key={player.id} className="hover:bg-primary/5">
                    <TableCell className="text-center font-bold">
                      <RankBadge rank={player.rank} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.photoURL} alt={player.name} />
                          <AvatarFallback>
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {player.rating || 1000}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{player.rank || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      </div>
    </AppShell>
  );
}
