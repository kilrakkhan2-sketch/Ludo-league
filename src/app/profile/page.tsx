
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, Percent, User, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ icon, title, value, loading }: { icon: React.ReactNode, title: string, value: string | number, loading?: boolean }) => (
    <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold font-headline">{value}</p>}
        </CardContent>
    </Card>
);

export default function ProfilePage() {
    const { userData, loading } = useUser();

    const matchesPlayed = userData?.matchesPlayed || 0;
    const matchesWon = userData?.matchesWon || 0;
    const winRate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).toFixed(1) : '0';

    return (
        <div className="container py-12 md:py-16">
            <div className="text-center mb-10 md:mb-14">
                 <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">Your Player Profile</h1>
                <p className="max-w-xl mx-auto mt-3 text-muted-foreground">Your stats, your journey, your legacy.</p>
            </div>
           
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                
                {/* Left Column: User Info */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Player Information</CardTitle>
                            <CardDescription>Your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-3/4" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4">
                                        <User className="w-5 h-5 text-primary" />
                                        <span className="font-semibold">{userData?.displayName}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <span className="text-muted-foreground">{userData?.email}</span>
                                    </div>
                                    {userData?.isVerified && (
                                        <div className="flex items-center gap-4">
                                            <ShieldCheck className="w-5 h-5 text-green-500" />
                                            <span className="text-sm font-semibold text-green-500">Account Verified</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <Button asChild className="w-full mt-2">
                                <Link href="/settings">Edit Profile & Settings</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Stats */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard 
                            icon={<Swords className="w-5 h-5 text-muted-foreground"/>}
                            title="Matches Played"
                            value={matchesPlayed}
                            loading={loading}
                        />
                        <StatCard 
                            icon={<Trophy className="w-5 h-5 text-muted-foreground"/>}
                            title="Total Wins"
                            value={matchesWon}
                            loading={loading}
                        />
                        <StatCard 
                            icon={<Percent className="w-5 h-5 text-muted-foreground"/>}
                            title="Win Rate"
                            value={`${winRate}%`}
                            loading={loading}
                        />
                    </div>
                    
                    {/* Placeholder for Match History - can be a future feature */}
                    <div className="mt-8 text-center p-8 bg-card/30 rounded-lg">
                        <p className="text-muted-foreground">Match history coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

    