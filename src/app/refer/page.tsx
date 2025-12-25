'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useDoc, useCollection } from "@/firebase";
import { UserProfile, CommissionSettings } from "@/types";
import { Copy, Gift, Users, Share2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReferPage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");
  const { data: commissionSettings, loading: settingsLoading } = useDoc<CommissionSettings>('settings/commission');

  const { data: referredUsers, loading: referralsLoading } = useCollection<UserProfile>(
      profile?.referralCode ? `users` : undefined, 
      { where: ['referredBy', '==', profile?.referralCode] }
  );

  const { toast } = useToast();

  const loading = userLoading || profileLoading || settingsLoading || referralsLoading;

  const referralCode = profile?.referralCode || '...';
  const referralEarnings = profile?.referralEarnings || 0;
  const totalReferrals = referredUsers?.length || 0;
  const commissionRate = commissionSettings?.isEnabled ? (commissionSettings.rate || 0) * 100 : 0;

  const copyCode = () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral Link Copied!" });
  };
  
  const shareCode = () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on LudoLeague!',
        text: `Join me on LudoLeague and get a bonus! Use my referral code: ${referralCode}`,
        url: referralLink,
      }).catch((error) => console.log('Error sharing', error));
    } else {
        copyCode();
        toast({title: "Link Copied!", description: "Sharing not supported on this browser. Link copied to clipboard instead."})
    }
  };

  return (
    <AppShell pageTitle="Refer & Earn" showBackButton>
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="bg-primary text-primary-foreground text-center overflow-hidden">
          <CardContent className="p-6 space-y-2">
            <Gift className="mx-auto h-12 w-12 opacity-80" />
            <h2 className="text-2xl font-bold">Invite Friends, Earn Rewards!</h2>
            {loading ? <Skeleton className="h-5 w-3/4 mx-auto bg-white/20" /> : (
                 <p className="text-sm opacity-90 max-w-xs mx-auto">
                    Get {commissionRate > 0 ? `${commissionRate}% commission` : 'a bonus'} on every deposit your friend makes. They get a bonus too!
                </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground text-sm">Your Unique Referral Link</p>
            {loading ? (
                <Skeleton className="h-10 w-40 mx-auto" />
            ) : (
                <div 
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/50 bg-primary/10 p-3 rounded-lg cursor-pointer"
                    onClick={copyCode}
                >
                  <p className="text-xl font-bold font-mono tracking-widest text-primary">{referralCode}</p>
                  <Copy className="h-5 w-5 text-primary" />
                </div>
            )}
            <Button className="w-full sm:w-auto" onClick={shareCode}>
                <Share2 className="mr-2 h-4 w-4" /> Share Your Link
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-6 w-8"/> : <div className="text-2xl font-bold">{totalReferrals}</div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-6 w-12"/> : <div className="text-2xl font-bold">₹{referralEarnings.toLocaleString()}</div>}
                </CardContent>
            </Card>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2">Your Referred Friends</h3>
            <div className="space-y-2">
                {loading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                {!loading && referredUsers && referredUsers.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src={friend.photoURL} />
                                <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{friend.displayName}</p>
                                <p className={`text-xs ${(friend.stats?.matchesPlayed || 0) > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {(friend.stats?.matchesPlayed || 0) > 0 ? 'First Game Played!' : 'Joined'}
                                </p>
                            </div>
                        </div>
                        {(friend.stats?.matchesPlayed || 0) > 0 && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                ))}
                 {!loading && totalReferrals === 0 && (
                    <p className="text-center text-muted-foreground py-8">You haven't referred anyone yet.</p>
                )}
            </div>
        </div>
      </div>
    </AppShell>
  );
}
