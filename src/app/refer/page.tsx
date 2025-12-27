'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Gift, Users } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useDoc } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types";

const StatCard = ({ icon, title, value, loading }: { icon: React.ReactNode, title: string, value: string | number, loading?: boolean }) => (
    <Card className="bg-muted/50">
        <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{value}</p>}
        </CardContent>
    </Card>
);

export default function ReferPage() {
    const { user, loading: userLoading } = useUser();
    const { data: userData, loading: userDataLoading } = useDoc<UserProfile>(user ? `users/${user.uid}`: undefined);

    const { data: referrals, loading: referralsLoading } = useCollection<UserProfile>(
        user ? `users/${user.uid}/referrals` : undefined
    );

    const referralLink = userData ? `${window.location.origin}/join?ref=${userData.referralCode}` : '';
    const { toast } = useToast();

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({ title: "Copied!", description: "Referral link copied to clipboard." });
        }).catch(err => {
            toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
        });
    };

    const loading = userLoading || referralsLoading || userDataLoading;

    const totalReferrals = referrals?.length || 0;
    const referralEarnings = userData?.referralEarnings || 0;

    return (
        <AppShell pageTitle="Refer & Earn">
            <div className="p-4 sm:p-6 space-y-6">
                <Card className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground overflow-hidden">
                     <CardHeader className="relative">
                        <Gift className="absolute right-4 top-4 w-16 h-16 text-primary-foreground/20"/>
                        <CardTitle className="text-3xl font-bold">Invite Friends, Earn Rewards!</CardTitle>
                        <CardDescription className="text-primary-foreground/80">Share your referral link with friends. You'll get a bonus for every friend that joins and plays!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold mb-2">Your Unique Referral Link</p>
                        <div className="flex items-center space-x-2 bg-background/20 p-2 rounded-md">
                            <input 
                                type="text" 
                                value={referralLink} 
                                readOnly 
                                className="flex-1 bg-transparent outline-none text-sm text-primary-foreground placeholder-primary-foreground/70"
                                placeholder={loading ? "Generating link..." : ""}
                            />
                            <Button onClick={copyToClipboard} size="icon" variant="ghost" className="shrink-0 hover:bg-background/30" disabled={loading}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard 
                        icon={<Users className="w-4 h-4 text-muted-foreground"/>}
                        title="Friends Joined"
                        value={totalReferrals}
                        loading={loading}
                    />
                    <StatCard 
                        icon={<Gift className="w-4 h-4 text-muted-foreground"/>}
                        title="Referral Earnings"
                        value={`₹${referralEarnings.toFixed(2)}`}
                        loading={loading}
                    />
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Your Referred Friends</CardTitle>
                        <CardDescription>Track the status of your referrals and earnings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                           <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                           </div>
                        ) : referrals && referrals.length > 0 ? (
                             <div className="space-y-4">
                                {referrals.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={friend.photoURL} />
                                                <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{friend.displayName}</p>
                                                <p className={`text-xs ${(friend.matchesPlayed || 0) > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                    {(friend.matchesPlayed || 0) > 0 ? 'First Game Played!' : 'Joined'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-green-500">+₹{10}</p>
                                            <p className="text-xs text-muted-foreground">Bonus</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-muted rounded-lg">
                                <p className="font-semibold">No friends have joined yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">Share your link to get started!</p>
                           </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
