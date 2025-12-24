
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, ShieldQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";

const ArenaCard = ({ icon, title, description, link, actionText }: { icon: React.ReactNode, title: string, description: string, link: string, actionText: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
        <CardHeader className="text-center">
            <div className="mx-auto bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-full w-20 h-20 flex items-center justify-center border border-primary/20 mb-4">
                {icon}
            </div>
            <CardTitle className="font-headline text-2xl">{title}</CardTitle>
            <CardDescription className="px-4">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
            <Button asChild className="w-full font-bold text-lg mt-4">
                <Link href={link}>{actionText} <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
        </CardContent>
    </Card>
);

export default function PlayPage() {
    return (
        <div className="container py-12 md:py-16">
            <div className="text-center mb-10 md:mb-14">
                 <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">Choose Your Arena</h1>
                <p className="max-w-xl mx-auto mt-3 text-muted-foreground">The ultimate Ludo experience awaits. Where will you prove your skill today?</p>
            </div>
           
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
                
                <ArenaCard 
                    icon={<Swords className="w-10 h-10 text-primary" />}
                    title="1v1 Quick Match"
                    description="Jump straight into a fast-paced match against a single opponent. Climb the ranks and prove your mettle."
                    link="/play/quick-match"
                    actionText="Find Match"
                />
                
                <ArenaCard 
                    icon={<Trophy className="w-10 h-10 text-amber-400" />}
                    title="Tournaments"
                    description="Compete in high-stakes tournaments with massive prize pools. Battle through rounds to claim the ultimate glory."
                    link="/tournaments"
                    actionText="Browse Tournaments"
                />

                <ArenaCard 
                    icon={<ShieldQuestion className="w-10 h-10 text-gray-400" />}
                    title="Practice Mode"
                    description="Hone your skills and test new strategies in a risk-free environment. Play against AI with no entry fee."
                    link="/play/practice"
                    actionText="Start Practice"
                />
            </div>
        </div>
    );
}
