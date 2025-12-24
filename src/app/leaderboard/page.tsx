
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Trophy, User } from "lucide-react";
import { useCollection, useUser } from "@/firebase";
import type { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const getRankColor = (rank: number) => {
  if (rank === 0) return 'text-yellow-500';
  if (rank === 1) return 'text-gray-400';
  if (rank === 2) return 'text-orange-400';
  return 'text-muted-foreground';
};

const LeaderboardRow = ({ player, rank }: { player: UserProfile; rank: number }) => (
    <TableRow className={rank < 3 ? 'bg-primary/5' : ''}>
        <TableCell className="text-center font-bold text-lg w-16">
            {rank < 3 ? (
                <Award className={cn("mx-auto h-7 w-7", getRankColor(rank))} />
            ) : (
                <span className="text-base">{rank + 1}</span>
            )}
        </TableCell>
        <TableCell>
            <div className="flex items-center gap-4">
                <Avatar className="w-11 h-11 border-2 border-muted">
                    <AvatarImage src={player.photoURL} />
                    <AvatarFallback>{player.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium text-base">{player.displayName || "Anonymous Player"}</span>
                  <p className="text-xs text-muted-foreground">Played: {player.matchesPlayed || 0}</p>
                </div>
            </div>
        </TableCell>
        <TableCell className="text-right font-bold text-lg">₹{player.totalWinnings?.toLocaleString() || 0}</TableCell>
    </TableRow>
);


export default function LeaderboardPage() {
    const { userData } = useUser();
    const { data: leaderboard, loading } = useCollection<UserProfile>(
        `users`,
        { 
            orderBy: ["totalWinnings", "desc"],
            limit: 20
        }
    );

    return (
        <AppShell pageTitle="Leaderboard" showBackButton>
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-3">

                {/* Main Leaderboard */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-card-foreground text-background p-6">
                            <div className="flex items-center gap-4">
                                <Trophy className="h-10 w-10" />
                                <div>
                                    <CardTitle className="text-2xl">All-Time Champions</CardTitle>
                                    <p className="text-sm opacity-80">Top 20 earners on the platform.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 text-center">Rank</TableHead>
                                        <TableHead>Player</TableHead>
                                        <TableHead className="text-right">Total Winnings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && [...Array(7)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-8 w-8 rounded-full mx-auto"/></TableCell>
                                            <TableCell><Skeleton className="h-8 w-48"/></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24 ml-auto"/></TableCell>
                                        </TableRow>
                                    ))}
                                    {!loading && leaderboard?.map((player, index) => (
                                        <LeaderboardRow key={player.uid} player={player} rank={index} />
                                    ))}
                                </TableBody>
                            </Table>
                            {!loading && leaderboard?.length === 0 && (
                                <p className="text-center text-muted-foreground py-12">The competition is just getting started!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* User's Rank Card */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Your Standing</CardTitle>
                            <CardDescription>Your performance summary.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                                <p className="font-medium">Matches Played</p>
                                <p className="font-bold text-lg">{userData?.matchesPlayed || 0}</p>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                                <p className="font-medium">Total Winnings</p>
                                <p className="font-bold text-lg text-green-600">₹{userData?.totalWinnings?.toLocaleString() || 0}</p>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                                <p className="font-medium">Win Rate</p>
                                <p className="font-bold text-lg">{userData && userData.matchesPlayed > 0 ? `${((userData.matchesWon / userData.matchesPlayed) * 100).toFixed(0)}%` : 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </AppShell>
    );
}
