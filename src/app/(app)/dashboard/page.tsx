
'use client';
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Swords, Trophy, Wallet, BarChart, ShieldCheck } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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

const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner-')).slice(0, 8);

const ludoClassicImage = PlaceHolderImages.find(img => img.id === 'ludo-classic');
const ludoPopularImage = PlaceHolderImages.find(img => img.id === 'ludo-popular');


const FeatureCard = ({ card }: { card: typeof featureCards[0] }) => (
    <Card className="w-full shadow-md transition-shadow flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-4">
                <card.icon className={`h-8 w-8 ${card.color}`} />
                <CardTitle className="text-xl">{card.title}</CardTitle>
            </div>
             <CardDescription className="pt-2">{card.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-end">
            <Button asChild className="w-full" variant="accent">
                <Link href={card.href}>{card.cta}</Link>
            </Button>
        </CardContent>
    </Card>
);

const GameTypeCard = ({ title, image }: { title: string, image?: { imageUrl: string, imageHint: string, description: string } }) => (
    <Card className="w-full shadow-md transition-shadow overflow-hidden">
        <CardContent className="p-0">
            <div className="relative aspect-[4/3] w-full">
                {image && (
                    <Image
                        src={image.imageUrl}
                        alt={image.description}
                        fill
                        className="object-cover"
                        data-ai-hint={image.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <CardTitle className="text-xl text-white">{title}</CardTitle>

                </div>
            </div>
        </CardContent>
    </Card>
);


export default function DashboardPage() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="space-y-6">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {bannerImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[2/1] w-full">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      fill
                      className="object-cover"
                      data-ai-hint={image.imageHint}
                    />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4" />
        <CarouselNext className="absolute right-4" />
      </Carousel>

      <div className="grid grid-cols-2 gap-4">
        <GameTypeCard title="Ludo Classic" image={ludoClassicImage} />
        <GameTypeCard title="Ludo Popular" image={ludoPopularImage} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}
