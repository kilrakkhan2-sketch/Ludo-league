
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useDoc, useCollection } from "@/firebase";
import { UserProfile } from "@/types";
import { Copy, Gift, Users, Share2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const friends = [
  { name: "Aarav Sharma", status: "Joined", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav" },
  { name: "Priya Patel", status: "1st Game Pending", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya" },
  { name: "Rohan Kumar", status: "Joined", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan" },
];

export default function ReferPage() {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");
  const { toast } = useToast();

  const loading = userLoading || profileLoading;

  const referralCode = profile?.referralCode || 'LUDO123';
  const referralEarnings = profile?.referralEarnings || 0;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Referral Code Copied!" });
  };
  
  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on LudoLeague!',
        text: `Join me on LudoLeague and get a bonus! Use my referral code: ${referralCode}`,
        url: window.location.origin,
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
            <p className="text-sm opacity-90 max-w-xs mx-auto">
              Get 5% commission on every deposit your friend makes. They get a bonus too!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground text-sm">Your Referral Code</p>
            {loading ? (
                <Skeleton className="h-10 w-40 mx-auto" />
            ) : (
                <div 
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/50 bg-primary/10 p-3 rounded-lg cursor-pointer"
                    onClick={copyCode}
                >
                  <p className="text-2xl font-bold font-mono tracking-widest text-primary">{referralCode}</p>
                  <Copy className="h-5 w-5 text-primary" />
                </div>
            )}
            <Button className="w-full sm:w-auto" onClick={shareCode}>
                <Share2 className="mr-2 h-4 w-4" /> Share with Friends
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
                    {loading ? <Skeleton className="h-6 w-8"/> : <div className="text-2xl font-bold">3</div>}
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
                {friends.map((friend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src={friend.avatar} />
                                <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{friend.name}</p>
                                <p className={`text-xs ${friend.status === 'Joined' ? 'text-success' : 'text-muted-foreground'}`}>{friend.status}</p>
                            </div>
                        </div>
                        {friend.status === 'Joined' && <CheckCircle className="h-5 w-5 text-success" />}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </AppShell>
  );
}
