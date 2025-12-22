
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Trophy } from "lucide-react";


const leaderboardData = [
  { rank: 1, name: "Rohan S.", winnings: 50240, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan" },
  { rank: 2, name: "Priya K.", winnings: 45100, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya" },
  { rank: 3, name: "Amit G.", winnings: 38500, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Amit" },
  { rank: 4, name: "Sneha M.", winnings: 32000, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha" },
  { rank: 5, name: "Vikram R.", winnings: 28900, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram" },
];


export default function LeaderboardPage() {
  return (
    <AppShell pageTitle="Leaderboard" showBackButton>
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-10 w-10" />
              <div>
                <CardTitle className="text-2xl">Weekly Champions</CardTitle>
                <p className="text-sm opacity-90">Top earners of the week. Do you have what it takes?</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Winnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((player, index) => (
                  <TableRow key={index} className={index < 3 ? 'bg-yellow-500/10' : ''}>
                    <TableCell className="text-center font-bold text-lg">
                      {index < 3 ? (
                        <Award className={`mx-auto h-6 w-6 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-400'
                        }`} />
                      ) : (
                        player.rank
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">₹{player.winnings.toLocaleString()}</TableCell>
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
