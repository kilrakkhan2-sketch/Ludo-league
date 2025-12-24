
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, Percent, User, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
    <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold font-headline">{value}</p>
        </CardContent>
    </Card>
);

export default function ProfilePage() {
    // Mock data - in a real app, this would come from a user session or API call
    const user = {
        name: "Ravi Kumar",
        email: "ravi.k@example.com",
        matchesPlayed: 128,
        wins: 82,
    };

    const winRate = user.matchesPlayed > 0 ? ((user.wins / user.matchesPlayed) * 100).toFixed(1) : 0;

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
                            <div className="flex items-center gap-4">
                                <User className="w-5 h-5 text-primary" />
                                <span className="font-semibold">{user.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="w-5 h-5 text-primary" />
                                <span className="text-muted-foreground">{user.email}</span>
                            </div>
                             <div className="flex items-center gap-4">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-semibold text-green-500">Account Verified</span>
                            </div>
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
                            value={user.matchesPlayed}
                        />
                        <StatCard 
                            icon={<Trophy className="w-5 h-5 text-muted-foreground"/>}
                            title="Total Wins"
                            value={user.wins}
                        />
                        <StatCard 
                            icon={<Percent className="w-5 h-5 text-muted-foreground"/>}
                            title="Win Rate"
                            value={`${winRate}%`}
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
