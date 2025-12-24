
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, ShieldCheck, Swords, Trophy, Wallet } from "lucide-react";
import Link from "next/link";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex-row items-center gap-4">
            <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                {description}
            </p>
        </CardContent>
    </Card>
);

export default function MarketingPage() {
  return (
    <div className="space-y-20 md:space-y-28 lg:space-y-36 pb-20">
        {/* Hero Section */}
        <section className="container text-center pt-24 md:pt-32">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter !leading-[1.2]">
                Where Skill Meets Fortune. <br/>
                <span className="bg-gradient-to-r from-primary via-amber-400 to-yellow-500 text-transparent bg-clip-text">
                    The Ultimate Ludo Arena.
                </span>
            </h1>
            <p className="max-w-xl mx-auto mt-6 text-lg text-muted-foreground">
                Challenge players, join thrilling tournaments, and win real cash prizes. Experience the classic game of Ludo, reimagined for the competitive player.
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
                <Button asChild size="lg" className="font-bold text-lg">
                    <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        </section>

        {/* Features Section */}
        <section className="container">
            <div className="text-center space-y-3">
                <p className="text-primary font-bold">FEATURES</p>
                <h2 className="text-3xl md:text-4xl font-headline">Everything You Need to Compete</h2>
                <p className="max-w-2xl mx-auto text-muted-foreground">
                    Our platform is built from the ground up with the competitive player in mind. Fair, fast, and fun.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                <FeatureCard 
                    icon={<Swords size={24}/>} 
                    title="Instant 1v1 Battles"
                    description="No more waiting. Jump directly into a 1v1 match and prove your skill to climb the leaderboard."
                />
                <FeatureCard 
                    icon={<Trophy size={24}/>} 
                    title="Structured Tournaments"
                    description="Compete in daily, weekly, and special event tournaments with massive prize pools and guaranteed glory."
                />
                <FeatureCard 
                    icon={<ShieldCheck size={24}/>} 
                    title="Secure & Fair Play"
                    description="With our advanced conflict resolution and secure wallet system, you can play with confidence."
                />
            </div>
        </section>

         {/* Final CTA Section */}
         <section className="container">
             <div className="bg-gradient-to-r from-green-900/50 via-card to-yellow-900/50 p-8 md:p-12 rounded-2xl border border-primary/20 text-center">
                <h2 className="text-3xl md:text-4xl font-headline">Ready to Claim Your Crown?</h2>
                <p className="max-w-xl mx-auto mt-4 text-muted-foreground">
                    Join thousands of players in the most exciting Ludo community. Your first match is just a click away.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg" className="font-bold text-lg">
                        <Link href="/signup">Sign Up Now & Play</Link>
                    </Button>
                </div>
             </div>
         </section>
    </div>
  );
}
