"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Trophy } from "lucide-react";

const players = [
  { rank: 1, name: "LudoKing99", rating: 2850, wins: 152, avatar: "https://picsum.photos/seed/player1/100/100" },
  { rank: 2, name: "DiceMaster", rating: 2780, wins: 140, avatar: "https://picsum.photos/seed/player2/100/100" },
  { rank: 3, name: "Strategist", rating: 2750, wins: 135, avatar: "https://picsum.photos/seed/player3/100/100" },
  { rank: 4, name: "LuckyStriker", rating: 2690, wins: 128, avatar: "https://picsum.photos/seed/player4/100/100" },
  { rank: 5, name: "QueenOfLudo", rating: 2650, wins: 120, avatar: "https://picsum.photos/seed/player5/100/100" },
  { rank: 6, name: "TheGambler", rating: 2610, wins: 115, avatar: "https://picsum.photos/seed/player6/100/100" },
  { rank: 7, name: "RookieSlayer", rating: 2580, wins: 110, avatar: "https://picsum.photos/seed/player7/100/100" },
  { rank: 8, name: "KnightRider", rating: 2550, wins: 105, avatar: "https://picsum.photos/seed/player8/100/100" },
  { rank: 9, name: "PawnPusher", rating: 2520, wins: 100, avatar: "https://picsum.photos/seed/player9/100/100" },
  { rank: 10, name: "StarPlayer", rating: 2500, wins: 98, avatar: "https://picsum.photos/seed/player10/100/100" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <Badge className="bg-yellow-500 text-white">
        <Trophy className="w-3 h-3 mr-1" />
        {rank}
      </Badge>
    );
  if (rank === 2) return <Badge className="bg-slate-400 text-white">{rank}</Badge>;
  if (rank === 3) return <Badge className="bg-orange-600 text-white">{rank}</Badge>;
  return <Badge variant="secondary">{rank}</Badge>;
}

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Leaderboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>
              Global rankings based on player performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.rank}>
                    <TableCell>
                      <RankBadge rank={player.rank} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {player.rating}
                    </TableCell>
                    <TableCell className="text-right">{player.wins}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
