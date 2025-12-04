'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Swords, Shield, Star, Award, Edit } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/firebase/auth/use-user";
import { useDocument } from "@/firebase/firestore/use-document";
import { useCollection } from "@/firebase/firestore/use-collection";
import { UserProfile, Match } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const ProfilePageSkeleton = () => (
    <div className="space-y-6">
        <Card className="overflow-hidden">
            <Skeleton className="h-40 md:h-56 w-full" />
            <div className="relative p-4 pb-0 -mt-16 sm:-mt-20 flex flex-col md:flex-row items-center gap-4">
                <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-card" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                    <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
                    <Skeleton className="h-5 w-24 mx-auto md:mx-0" />
                </div>
            </div>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
            </CardContent>
        </Card>
        <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
            <Card className="lg:col-span-1">
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        </div>
    </div>
);

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDocument<UserProfile>(user ? `users/${user.uid}` : undefined);
  const { data: matches, loading: matchesLoading } = useCollection<Match>('matches', {
    where: user ? ['players', 'array-contains', user.uid] : undefined,
    limit: 10,
    orderBy: ['createdAt', 'desc']
  });

  if (userLoading || profileLoading || matchesLoading) {
    return <AppShell><ProfilePageSkeleton /></AppShell>;
  }

  if (!user || !profile) {
    return <AppShell><div className="text-center p-8">Please log in to view your profile.</div></AppShell>;
  }

  const wins = matches.filter(m => m.winnerId === user.uid).length;
  const totalMatches = matches.length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const stats = [
    { icon: Trophy, label: "Wins", value: wins },
    { icon: Swords, label: "Matches", value: totalMatches },
    { icon: Shield, label: "Win Rate", value: `${winRate}%` },
    { icon: Star, label: "Rating", value: profile.rating || 1000 },
  ];

  const level = Math.floor((profile.xp || 0) / 1000);
  const xpForNextLevel = (level + 1) * 1000;
  const xpProgress = ((profile.xp || 0) % 1000) / 10; // As progress is out of 100

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative h-40 md:h-56 bg-muted">
            {profile.bannerUrl ? (
               <Image src={profile.bannerUrl} alt="Profile banner" fill className="object-cover" />
            ) : <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-full" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="relative p-4 pb-0 -mt-16 sm:-mt-20 flex flex-col md:flex-row items-center gap-4">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card">
              <AvatarImage src={profile.photoURL || undefined} />
              <AvatarFallback>{profile.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold font-headline text-white md:text-foreground">{profile.displayName}</h1>
                <Button variant="outline" disabled> <Edit className="w-4 h-4 mr-2"/> Edit Profile</Button>
              </div>
              <p className="text-muted-foreground text-white/80 md:text-muted-foreground">@{profile.username || user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Rank {profile.rank || 'N/A'}</span>
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
              <CardDescription>Your last {matches.length} games.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Prize</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{match.title}</TableCell>
                      <TableCell>
                        <Badge variant={match.winnerId === user.uid ? 'default' : 'destructive'}>
                          {match.winnerId === user.uid ? "Win" : "Loss"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDistanceToNow((match.createdAt as any).toDate(), { addSuffix: true })}</TableCell>
                      <TableCell className={`text-right font-semibold ${match.winnerId === user.uid ? 'text-green-500' : 'text-red-500'}`}>
                        {match.winnerId === user.uid ? `+₹${match.prizePool}` : `-₹${match.entryFee}`}
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
              <CardDescription>Level {level} - Grandmaster</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Progress value={xpProgress} />
                  <p className="text-sm text-muted-foreground">
                    {profile.xp || 0} / {xpForNextLevel} XP to next level
                  </p>
                </div>
                <Button className="w-full" variant="secondary" disabled>View Achievements</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
