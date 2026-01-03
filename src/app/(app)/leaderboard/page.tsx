
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/data";
import { cn } from "@/lib/utils";
import { BarChart, Crown, Medal, Trophy } from "lucide-react";

export default function LeaderboardPage() {
  // Sort users by winnings in descending order
  const sortedUsers = [...mockUsers].sort((a, b) => b.winnings - a.winnings);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-orange-400" />;
    return <span className="font-bold text-lg">{rank}</span>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-8 w-8 text-primary"/>
            Leaderboard
        </h2>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>See who is leading the league with the most winnings.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center">Win Rate</TableHead>
                        <TableHead className="text-right">Winnings</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedUsers.map((user, index) => {
                        const rank = index + 1;
                        return (
                            <TableRow key={user.id} className={cn({
                                "bg-yellow-500/10": rank === 1,
                                "bg-slate-500/10": rank === 2,
                                "bg-orange-500/10": rank === 3,
                            })}>
                                <TableCell className="text-center">
                                    <div className="flex justify-center items-center h-full">
                                        {getRankIcon(rank)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-muted">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-semibold">{user.winRate}%</TableCell>
                                <TableCell className="text-right font-bold text-primary text-base">
                                    ₹{user.winnings.toLocaleString('en-IN')}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
