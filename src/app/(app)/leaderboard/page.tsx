'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for the leaderboard
const mockLeaderboardData = [
  { rank: 1, name: 'Rohan Sharma', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Rohan', winRate: 92, winnings: 75200 },
  { rank: 2, name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Priya', winRate: 88, winnings: 68100 },
  { rank: 3, name: 'Amit Singh', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Amit', winRate: 85, winnings: 59400 },
  { rank: 4, name: 'Sneha Reddy', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sneha', winRate: 84, winnings: 52300 },
  { rank: 5, name: 'Vikram Kumar', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Vikram', winRate: 81, winnings: 48900 },
  { rank: 6, name: 'Anjali Gupta', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Anjali', winRate: 79, winnings: 45100 },
  { rank: 7, name: 'Sandeep Nair', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sandeep', winRate: 78, winnings: 42800 },
  { rank: 8, name: 'Meera Desai', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Meera', winRate: 76, winnings: 40100 },
  { rank: 9, name: 'Karan Malhotra', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Karan', winRate: 75, winnings: 38500 },
  { rank: 10, name: 'Pooja Joshi', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Pooja', winRate: 73, winnings: 36200 },
  { rank: 11, name: 'Rajesh Verma', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Rajesh', winRate: 71, winnings: 34000 },
  { rank: 12, name: 'Sunita Rao', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sunita', winRate: 69, winnings: 31500 },
  { rank: 13, name: 'Deepak Iyer', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Deepak', winRate: 68, winnings: 29800 },
  { rank: 14, name: 'Natasha Shah', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Natasha', winRate: 66, winnings: 27100 },
  { rank: 15, name: 'Arjun Menon', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Arjun', winRate: 65, winnings: 25500 },
];

const getTrophyColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "transparent";
};

const TopPlayerCard = ({ user, rank }: { user: typeof mockLeaderboardData[0], rank: number }) => (
    <div className={cn(
        "relative flex flex-col items-center justify-end w-1/3 pt-12",
        rank === 1 && "-translate-y-6"
    )}>
        <Avatar className={cn(
            "w-24 h-24 border-4 shadow-lg",
            rank === 1 && "border-yellow-400",
            rank === 2 && "border-gray-400",
            rank === 3 && "border-orange-400",
        )}>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute top-10">
            <Trophy fill={getTrophyColor(rank)} strokeWidth={1} className={cn("w-8 h-8", rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-500" : "text-orange-600")} />
        </div>
        <h3 className="mt-3 text-lg font-bold text-card-foreground">{user.name}</h3>
        <p className="text-sm text-muted-foreground">Win Rate: {user.winRate}%</p>
        <p className="text-xl font-bold text-primary mt-1">₹{user.winnings.toLocaleString('en-IN')}</p>
        <div className={cn(
            "w-full h-24 mt-2 rounded-t-lg flex items-start justify-center pt-2",
            rank === 1 && "bg-yellow-400/20",
            rank === 2 && "bg-gray-400/20",
            rank === 3 && "bg-orange-400/20",
        )}>
            <span className="text-4xl font-black text-white/50">{rank}</span>
        </div>
    </div>
);

export default function LeaderboardPage() {

    const topThree = mockLeaderboardData.slice(0, 3);
    const rest = mockLeaderboardData.slice(3);

    const [first, second, third] = topThree;

    return (
        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-primary"/>
                    Weekly Leaderboard
                </CardTitle>
                <CardDescription>Top players of the week based on their winnings.</CardDescription>
              </CardHeader>
              <CardContent>
                 {/* Top 3 Podium */}
                 <div className="flex justify-around items-end border-b pb-4 mb-6">
                    {second && <TopPlayerCard user={second} rank={2} />}
                    {first && <TopPlayerCard user={first} rank={1} />}
                    {third && <TopPlayerCard user={third} rank={3} />}
                 </div>
                
                {/* Rest of the Leaderboard */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/6">Rank</TableHead>
                            <TableHead className="w-3/6">Player</TableHead>
                            <TableHead className="w-1/6 text-center">Win Rate</TableHead>
                            <TableHead className="w-1/6 text-right">Winnings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rest.map((user) => (
                            <TableRow key={user.rank}>
                                <TableCell className="font-bold text-lg">{user.rank}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{user.winRate}%</TableCell>
                                <TableCell className="text-right font-semibold text-primary">
                                    ₹{user.winnings.toLocaleString('en-IN')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
    );
}
