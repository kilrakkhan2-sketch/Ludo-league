
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Newspaper, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { ImageSlider } from "@/components/app/ImageSlider"; // Import the new slider
import { PlaceHolderImages } from "@/lib/placeholder-images";
import NewsTicker from "@/components/NewsTicker";

// Define the banner images from placeholders
const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner-')).map(img => img.imageUrl);


const ActionCard = ({ title, description, href, icon: Icon }: { title: string, description: string, href: string, icon: React.ElementType }) => (
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

export default function DashboardPage() {
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

        {/* === Placeholder for recent matches/activity === */}
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>An overview of your recent matches and results.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-8">
                    <p>Your recent matches will appear here.</p>
                    <Button variant="link" asChild>
                        <Link href="/history">View Match History</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
