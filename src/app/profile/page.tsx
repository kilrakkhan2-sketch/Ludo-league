"use client";

import { AppShell } from "@/components/layout/AppShell";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Swords, Shield, Star, Award } from "lucide-react";
import Image from "next/image";

import { PlaceHolderImages } from "@/lib/placeholder-images";

const profileBannerImage = PlaceHolderImages.find((p) => p.id === "profile_banner");


const stats = [
  { icon: Trophy, label: "Wins", value: 152 },
  { icon: Swords, label: "Matches", value: 310 },
  { icon: Shield, label: "Win Rate", value: "49%" },
  { icon: Star, label: "Rating", value: 2850 },
];

const matchHistory = [
  { id: 1, mode: "Classic", result: "Win", prize: "+90", opponent: "DiceMaster", date: "2h ago" },
  { id: 2, mode: "Quick", result: "Loss", prize: "-50", opponent: "Strategist", date: "5h ago" },
  { id: 3, mode: "Master", result: "Win", prize: "+180", opponent: "LuckyStriker", date: "1d ago" },
  { id: 4, mode: "Classic", result: "Win", prize: "+35", opponent: "RookieSlayer", date: "2d ago" },
];

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative h-40 md:h-56 bg-muted">
            {profileBannerImage && (
               <Image
                src={profileBannerImage.imageUrl}
                alt={profileBannerImage.description}
                data-ai-hint={profileBannerImage.imageHint}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="relative p-4 pb-0 -mt-16 sm:-mt-20 flex flex-col md:flex-row items-center gap-4">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card">
              <AvatarImage src="https://picsum.photos/seed/user-avatar/200/200" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold font-headline text-white md:text-foreground">John Doe</h1>
                <Button className="mt-2 md:mt-0">Edit Profile</Button>
              </div>
              <p className="text-muted-foreground text-white/80 md:text-muted-foreground">@LudoKing99</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Rank 1</span>
                <span className="text-muted-foreground">(Top 1%)</span>
              </div>
            </div>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 bg-muted rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Your last 10 games.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mode</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Prize</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchHistory.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{match.mode}</TableCell>
                      <TableCell>
                        <Badge variant={match.result === "Win" ? "default" : "destructive"}>
                          {match.result}
                        </Badge>
                      </TableCell>
                      <TableCell>{match.opponent}</TableCell>
                      <TableCell>{match.date}</TableCell>
                      <TableCell className={`text-right font-semibold ${match.result === "Win" ? 'text-success' : 'text-destructive'}`}>
                        {match.prize}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
              <CardDescription>Level 12 - Grandmaster</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Progress value={65} />
                  <p className="text-sm text-muted-foreground">
                    12,345 / 20,000 XP to next level
                  </p>
                </div>
                <Button className="w-full" variant="secondary">View Achievements</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
