
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Swords, Users, Trophy, ChevronRight, Star, Loader2, AlertTriangle } from 'lucide-react';
import { useUser } from "@/firebase/auth/use-user"; 
import { useBalance } from '@/hooks/useBalance';
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Match, Tournament } from '@/lib/types';
import Link from 'next/link';

// Helper to convert Firestore Timestamp to sortable number
const toMillis = (timestamp: any): number => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000).getTime();
  }
  return 0;
};


export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { balance, setBalance } = useBalance();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch recent matches
          const matchesRef = collection(db, "matches");
          const matchesQuery = query(
            matchesRef, 
            where("players", "array-contains", user.uid)
          );
          const matchSnapshots = await getDocs(matchesQuery);
          const matches: Match[] = matchSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
          matches.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
          setRecentMatches(matches.slice(0, 3));

          // Fetch ongoing tournaments
          const tournamentsRef = collection(db, "tournaments");
          const tournamentsQuery = query(
            tournamentsRef, 
            where("status", "==", "ongoing")
          );
          const tournamentSnapshots = await getDocs(tournamentsQuery);
          const tournaments: Tournament[] = tournamentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
          tournaments.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
          setOngoingTournaments(tournaments.slice(0, 3));

        } catch (e: any) {
          console.error("Failed to fetch dashboard data:", e);
          setError("We couldn't load your dashboard. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6">Refresh Page</Button>
      </div>
    )
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* User Greeting and Profile */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.displayName || "Player"}!</h1>
            <p className="text-md text-muted-foreground">Ready to win big today?</p>
          </div>
        </div>
        <Link href="/profile">
           <Button variant="outline">My Profile</Button>
        </Link>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-8 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Wallet</span>
            <Link href="/wallet">
              <Button variant="secondary" size="sm">Manage Wallet</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">₹{balance.toFixed(2)}</p>
          <p className="text-sm opacity-80">Available to play and withdraw.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/lobby">
              <Button className="w-full h-24 flex-col gap-2" variant="outline">
                <Swords className="h-8 w-8 text-primary" />
                <span className="font-semibold">Find a Match</span>
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button className="w-full h-24 flex-col gap-2" variant="outline">
                <Trophy className="h-8 w-8 text-primary" />
                <span className="font-semibold">Join Tournament</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Leaderboard Snippet */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>See who is on top this week.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for leaderboard snippet */}
            <div className="flex items-center justify-center text-muted-foreground h-full">
              <p>Leaderboard coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Matches */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Matches</CardTitle>
            <Link href="/history">
              <span className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </CardHeader>
          <CardContent>
             {recentMatches.length > 0 ? (
              <ul className="space-y-4">
                {recentMatches.map(match => (
                  <li key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">vs Opponent</p>
                      <p className={`text-sm ${match.status === 'completed' && match.winner === user?.uid ? 'text-green-500' : 'text-red-500'}`}>
                        {match.status === 'completed' ? (match.winner === user?.uid ? 'Won' : 'Lost') : 'Ongoing'} ₹{match.entryFee}
                      </p>
                    </div>
                    <Link href={`/match/${match.id}`}><Button variant="secondary" size="sm">View</Button></Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent matches found.</p>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Tournaments */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ongoing Tournaments</CardTitle>
             <Link href="/tournaments">
                <span className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </span>
            </Link>
          </CardHeader>
          <CardContent>
             {ongoingTournaments.length > 0 ? (
                <ul className="space-y-4">
                  {ongoingTournaments.map(tournament => (
                    <li key={tournament.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{tournament.name}</p>
                        <p className="text-sm text-muted-foreground">Prize: ₹{tournament.prizePool}</p>
                      </div>
                       <Link href={`/tournaments/${tournament.id}`}><Button variant="secondary" size="sm">View</Button></Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">No ongoing tournaments.</p>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
