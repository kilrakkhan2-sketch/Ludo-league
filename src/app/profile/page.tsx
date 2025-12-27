
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Swords, Trophy, Percent, User, Mail, ShieldCheck, Edit } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPageContent } from "./SettingsPageContent";


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

const ProfileTabContent = () => {
    const { userData, loading } = useUser();

    const matchesPlayed = userData?.stats?.matchesPlayed || 0;
    const matchesWon = userData?.stats?.matchesWon || 0;
    const winRate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).toFixed(0) : '0';

    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
            <div className="bg-muted/30 p-6 flex flex-col items-center gap-4 text-center">
                 <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                    <AvatarImage src={userData?.photoURL} />
                    <AvatarFallback>{userData?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    {loading ? <Skeleton className="h-7 w-32"/> : <h2 className="text-2xl font-bold">{userData?.displayName}</h2>}
                    {loading ? <Skeleton className="h-4 w-40 mt-1"/> : <p className="text-sm text-muted-foreground">{userData?.email}</p>}
                </div>
                {userData?.isVerified && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                        <ShieldCheck className="w-4 h-4" />
                        <span>KYC Verified</span>
                    </div>
                )}
            </div>
             <CardFooter className="p-2">
                 <Button asChild variant="ghost" className="w-full">
                    <Link href="/profile?tab=settings">
                        <Edit className="mr-2 h-4 w-4"/> Edit Profile
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
                icon={<Swords className="w-4 h-4 text-muted-foreground"/>}
                title="Played"
                value={matchesPlayed}
                loading={loading}
            />
            <StatCard 
                icon={<Trophy className="w-4 h-4 text-muted-foreground"/>}
                title="Wins"
                value={matchesWon}
                loading={loading}
            />
            <StatCard 
                icon={<Percent className="w-4 h-4 text-muted-foreground"/>}
                title="Win Rate"
                value={`${winRate}%`}
                loading={loading}
            />
        </div>
        
        {/* Placeholder for Match History */}
        <Card>
            <CardHeader>
                <CardTitle>Match History</CardTitle>
                <CardDescription>Your recent match results will appear here.</CardDescription>
            </CardHeader>
             <CardContent className="text-center p-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">Match history coming soon...</p>
            </CardContent>
        </Card>
      </div>
    );
};


export default function ProfilePage({ searchParams }: { searchParams: { tab: string }}) {
    const defaultTab = searchParams.tab || "profile";
    
    return (
         <AppShell pageTitle="Profile">
            <div className="p-4 sm:p-6">
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                       <ProfileTabContent />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-6">
                        <SettingsPageContent />
                    </TabsContent>
                </Tabs>
            </div>
         </AppShell>
    );
}
