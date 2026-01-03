
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, Wallet, BarChart, ShieldCheck } from "lucide-react";
import Link from "next/link";


const featureCards = [
    {
        title: "Play Now",
        description: "Join an existing match or create your own.",
        icon: Swords,
        href: "/lobby",
        cta: "Go to Lobby",
        color: "text-primary",
    },
    {
        title: "Tournaments",
        description: "Compete in large-scale tournaments for bigger prizes.",
        icon: Trophy,
        href: "/tournaments",
        cta: "View Tournaments",
        color: "text-yellow-500",
    },
    {
        title: "My Wallet",
        description: "Deposit, withdraw, and track your winnings.",
        icon: Wallet,
        href: "/wallet",
        cta: "Manage Wallet",
        color: "text-green-500",
    },
    {
        title: "Leaderboard",
        description: "See how you rank against the top players.",
        icon: BarChart,
        href: "/leaderboard",
        cta: "View Rankings",
        color: "text-orange-500",
    },
    {
        title: "KYC Status",
        description: "Verify your identity to unlock withdrawals.",
        icon: ShieldCheck,
        href: "/kyc",
        cta: "Complete KYC",
        color: "text-blue-500",
    },
];

const FeatureCard = ({ card }: { card: typeof featureCards[0] }) => (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-4">
                <card.icon className={`h-8 w-8 ${card.color}`} />
                <CardTitle className="text-xl">{card.title}</CardTitle>
            </div>
             <CardDescription className="pt-2">{card.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-end">
            <Button asChild className="w-full" variant="outline">
                <Link href={card.href}>{card.cta}</Link>
            </Button>
        </CardContent>
    </Card>
);

export default function DashboardPage() {

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} card={card} />
        ))}
      </div>
    </>
  );
}

