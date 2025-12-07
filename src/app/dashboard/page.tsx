
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Match, UserProfile, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageCircle, PlusCircle, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

const StatCard = ({ title, value, loading }: { title: string, value: string | number, loading: boolean }) => (
    <div className="bg-card p-3 rounded-lg shadow-sm text-center">
        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
            </div>
        ) : (
            <>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-lg font-bold">{value}</p>
            </>
        )}
    </div>
);

const MatchCard = ({ match }: { match: Match }) => (
    <div className="shrink-0 w-64 bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
            <h3 className="font-bold text-md">{match.title || "Classic Match"}</h3>
            <p className="text-xs opacity-80">Team Nork</p> 
        </div>
        <div className="p-3 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Room Code</span>
                <span className="font-mono">{match.ludoKingCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-bold">₹{match.entryFee.toLocaleString()}</span>
            </div>
        </div>
        <div className="p-2">
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href={`/match/${match.id}`}>
                    Ready
                </Link>
            </Button>
        </div>
    </div>
);


export default function DashboardPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
    const { data: myMatches, loading: myMatchesLoading } = useCollection<Match>('matches', {
        where: user?.uid ? ['players', 'array-contains', user.uid] : undefined,
        limit: 5,
        orderBy: ['createdAt', 'desc']
    });
     const { data: transactions, loading: txLoading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : '',
        {
          orderBy: ['createdAt', 'desc'],
          limit: 100
        }
    );

    const loading = userLoading || profileLoading || myMatchesLoading || txLoading;
    
    const matchesPlayed = myMatches.length;
    const matchesWon = myMatches.filter((m: Match) => m.winnerId === user?.uid).length;
    const winRate = matchesPlayed > 0 ? `${((matchesWon / matchesPlayed) * 100).toFixed(2)}%` : "0%";

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow pb-20">
                <div className="bg-primary text-primary-foreground p-4 rounded-b-3xl shadow-lg">
                    <header className="flex justify-between items-center mb-4">
                        {loading ? <Skeleton className="h-7 w-32 bg-white/20"/> : <h1 className="text-xl font-bold">Hi, {profile?.displayName || 'Player'}!</h1>}
                        <div className="flex items-center gap-4">
                            <MessageCircle className="h-6 w-6" />
                            <Bell className="h-6 w-6" />
                        </div>
                    </header>

                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm opacity-80">Wallet Balance</p>
                                {loading ? <Skeleton className="h-8 w-36 mt-1 bg-white/20"/> : <p className="text-3xl font-bold">₹{profile?.walletBalance?.toLocaleString() || '0.00'}</p>}
                            </div>
                            <Button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md" asChild>
                                <Link href="/add-money">
                                    Add Money
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 space-y-6">
                    <section>
                        <h2 className="text-lg font-bold mb-3">Quick Stats</h2>
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard title="Total Matches" value={matchesPlayed} loading={loading}/>
                            <StatCard title="Wins" value={matchesWon} loading={loading} />
                            <StatCard title="Win Rate" value={winRate} loading={loading} />
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-bold">My Active Matches</h2>
                            <Link href="/matches/my-matches" className="text-sm font-semibold text-primary">View All</Link>
                        </div>
                        {loading ? (
                             <div className="flex space-x-4 overflow-x-auto pb-4">
                                <Skeleton className="shrink-0 w-64 h-48 rounded-lg" />
                                <Skeleton className="shrink-0 w-64 h-48 rounded-lg" />
                             </div>
                        ): myMatches.length > 0 ? (
                            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                               {myMatches.map(match => <MatchCard key={match.id} match={match}/>)}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-card">
                                <p className="text-muted-foreground mb-2">No active matches</p>
                                <Button asChild>
                                    <Link href="/create-match"><PlusCircle className="mr-2 h-4 w-4"/>Create a Match</Link>
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
