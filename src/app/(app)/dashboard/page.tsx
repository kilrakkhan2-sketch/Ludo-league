
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Newspaper, Trophy, Users, Loader2, Star, Swords } from "lucide-react";
import Link from "next/link";
import { ImageSlider } from "@/components/app/ImageSlider";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import NewsTicker from "@/components/NewsTicker";
import { useUser, useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import type { Match } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define the banner images from placeholders
const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner-')).map(img => img.imageUrl);


const ActionCard = ({ title, description, href, icon: Icon }: { title: string, description:string, href: string, icon: React.ElementType }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow hover:bg-muted/50">
        <Link href={href} className="flex flex-col h-full">
            <CardHeader className="flex-row items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-primary"/>
                </div>
                <div>
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription>{description}</CardDescription>
            </CardContent>
        </Link>
    </Card>
);

const RecentMatchCard = ({ match }: { match: Match }) => {
    return (
        <Link href={`/match/${match.id}`} className="block hover:bg-muted/50 p-3 rounded-lg transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                        {match.players.slice(0, 2).map((player: any) => (
                        <Avatar key={player.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={player.avatarUrl} alt={player.name} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        ))}
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Prize: ₹{match.prizePool}</p>
                        <p className="text-xs text-muted-foreground">vs {match.players.find(p => p.id !== match.creatorId)?.name || 'Opponent'}</p>
                    </div>
                </div>
                <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", {
                    "bg-green-100 text-green-800": match.status === 'waiting',
                    "bg-blue-100 text-blue-800": match.status === 'in-progress',
                    "bg-gray-100 text-gray-800": match.status === 'completed',
                    "bg-red-100 text-red-800": match.status === 'disputed',
                })}>
                    {match.status}
                </div>
            </div>
        </Link>
    );
};


export default function DashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [recentMatches, setRecentMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    useEffect(() => {
        if (!user || !firestore) return;
        setLoadingMatches(true);
        const matchesRef = collection(firestore, 'matches');
        const q = query(
            matchesRef, 
            where('playerIds', 'array-contains', user.uid), 
            orderBy('createdAt', 'desc'), 
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setRecentMatches(matches);
            setLoadingMatches(false);
        }, (error) => {
            console.error("Error fetching recent matches: ", error);
            setLoadingMatches(false);
        });

        return () => unsubscribe();

    }, [user, firestore]);

  return (
    <div className="space-y-8">
        {/* === News Ticker Section === */}
        <NewsTicker />

        {/* === Image Slider Section === */}
        <ImageSlider images={bannerImages} />

        {/* === Quick Actions Section === */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
             <ActionCard 
                title="My Tournaments" 
                description="View your ongoing and upcoming tournaments." 
                href="/tournaments"
                icon={Trophy}
            />
             <ActionCard 
                title="Latest News" 
                description="Check out the latest news and announcements." 
                href="/news"
                icon={Newspaper}
            />
             <ActionCard 
                title="Community" 
                description="Connect with other players and find teams." 
                href="/community"
                icon={Users}
            />
             <ActionCard 
                title="Tutorials" 
                description="Learn how to play and improve your skills." 
                href="/tutorials"
                icon={GraduationCap}
            />
        </div>

        {/* === Recent Matches/Activity Section === */}
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-6 w-6 text-yellow-400"/>Recent Activity</CardTitle>
                <CardDescription>An overview of your 5 most recent matches.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingMatches ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : recentMatches.length > 0 ? (
                    <div className="space-y-2">
                        {recentMatches.map(match => (
                            <RecentMatchCard key={match.id} match={match} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-muted-foreground py-8">
                        <p>Your recent matches will appear here.</p>
                        <Button variant="link" asChild>
                            <Link href="/lobby">Play a Game</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
