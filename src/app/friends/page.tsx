
'use client';

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useCollection } from "@/firebase";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { Copy, Gift, Users, Share2, UserPlus, Sword, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const FriendRow = ({ friend }: { friend: Partial<UserProfile>}) => (
     <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
                <AvatarImage src={friend.photoURL} />
                <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{friend.displayName}</p>
                <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
                    <p className={`text-xs text-muted-foreground capitalize`}>{friend.status}</p>
                </div>
            </div>
        </div>
        <Button size="sm" variant="secondary"><Sword className="h-4 w-4 mr-2"/> Challenge</Button>
    </div>
)

const ReferralRow = ({ referral }: { referral: UserProfile}) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
        <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                <AvatarImage src={referral.photoURL} />
                <AvatarFallback>{referral.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{referral.displayName}</p>
                <p className={`text-xs ${referral.matchesPlayed > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {referral.matchesPlayed > 0 ? 'First Game Played!' : 'Joined'}
                </p>
            </div>
        </div>
        {referral.matchesPlayed > 0 && <CheckCircle className="h-5 w-5 text-green-500" />}
    </div>
)

export default function FriendsPage() {
  const { user, userData, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [friendUsername, setFriendUsername] = useState('');
  
  const { data: referredUsers, loading: referralsLoading } = useCollection<UserProfile>(
      `users`,
      { where: ["referredBy", "==", user?.uid || ''], limit: 10 }
  );
    const { data: friendsList, loading: friendsLoading } = useCollection<UserProfile>(
      user?.uid ? `users/${user.uid}/friends` : undefined,
      { orderBy: ["status", "asc"], limit: 20 }
  );

  const loading = userLoading || referralsLoading || friendsLoading;

  const referralCode = userData?.referralCode || '...';
  const referralEarnings = userData?.referralEarnings || 0;
  const totalReferrals = referredUsers?.length || 0;

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
  
  const handleAddFriend = () => {
      if (!friendUsername) return;
      toast({ title: "Friend Request Sent!", description: `Your request to ${friendUsername} has been sent.` });
      setFriendUsername('');
      // Here you would call a cloud function: 
      // const sendRequest = httpsCallable(functions, 'sendFriendRequest');
      // sendRequest({ username: friendUsername });
  }

  return (
    <AppShell pageTitle="Social Hub" showBackButton>
        <Tabs defaultValue="friends" className="p-4 sm:p-6">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="friends">My Friends</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Add a Friend</CardTitle>
                        <CardDescription>Search for a player by their exact username.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Input 
                            placeholder="Enter username..." 
                            value={friendUsername}
                            onChange={(e) => setFriendUsername(e.target.value)}
                        />
                        <Button onClick={handleAddFriend}><UserPlus className="h-4 w-4 mr-2"/>Add</Button>
                    </CardContent>
                </Card>
                <div>
                    <h3 className="text-lg font-semibold my-4">Your Friends List ({friendsList?.length || 0})</h3>
                    <div className="space-y-2">
                        {friendsLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        {!friendsLoading && friendsList?.map(friend => <FriendRow key={friend.uid} friend={friend} />)}
                        {!friendsLoading && friendsList?.length === 0 && <p className="text-center text-muted-foreground py-8">Your friends list is empty.</p>}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6 mt-4">
                 <Card className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-center overflow-hidden">
                    <CardContent className="p-6 space-y-2">
                        <Gift className="mx-auto h-12 w-12 opacity-80" />
                        <h2 className="text-2xl font-bold">Invite & Earn!</h2>
                        <p className="text-sm opacity-90 max-w-xs mx-auto">
                        Get 5% commission on every deposit your friend makes. They get a bonus too!
                        </p>
                    </CardContent>
                 </Card>

                <Card>
                    <CardContent className="p-6 text-center space-y-4">
                        <p className="text-muted-foreground text-sm">Your Unique Referral Code</p>
                        {userLoading ? (
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
                        <Button size="lg" className="w-full sm:w-auto" onClick={shareCode}>
                            <Share2 className="mr-2 h-4 w-4" /> Share Your Code
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
                            {referralsLoading ? <Skeleton className="h-6 w-8"/> : <div className="text-2xl font-bold">{totalReferrals}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {userLoading ? <Skeleton className="h-6 w-12"/> : <div className="text-2xl font-bold">₹{referralEarnings.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Your Referred Users</h3>
                    <div className="space-y-2">
                        {referralsLoading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        {!referralsLoading && referredUsers?.map((ref) => <ReferralRow key={ref.uid} referral={ref} />)}
                        {!referralsLoading && totalReferrals === 0 && (
                            <p className="text-center text-muted-foreground py-8">You haven't referred anyone yet.</p>
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </AppShell>
  );
}
