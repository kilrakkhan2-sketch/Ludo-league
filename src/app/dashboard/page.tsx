
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import type { Announcement, Match } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { Bell, MessageCircle, PlusCircle, Swords, Wallet, Gift, ShieldCheck, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { PlayerAvatarList } from "@/components/matches/PlayerAvatarList";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Users, Trophy } from "lucide-react";
import Image from "next/image";

// MatchCard is now flexible and will adapt to its container
const MatchCard = ({ match }: { match: Match }) => {
    const isFull = match.players.length >= match.maxPlayers;

    const getStatusVariant = (status: Match['status']) => {
        switch (status) {
            case 'waiting': return isFull ? 'destructive' : 'outline';
            case 'room_code_pending': return 'default';
            case 'room_code_shared': return 'default';
            case 'game_started': return 'default';
            case 'result_submitted': return 'secondary';
            case 'completed': return 'secondary';
            case 'disputed': return 'destructive';
            default: return 'default';
        }
    }

    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow w-full bg-card border border-border">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-base leading-tight text-primary">{match.title}</CardTitle>
              <CardDescription className="mt-1">
                Entry: <span className="font-bold text-foreground">₹{match.entryFee}</span>
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(match.status)}
              className="capitalize shrink-0"
            >
              {isFull && match.status === 'waiting' ? 'Full' : match.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow space-y-3">
          <PlayerAvatarList playerIds={match.players} maxPlayers={match.maxPlayers} />
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {match.players.length} / {match.maxPlayers} Players
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-4 rounded-b-lg">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <p className="text-lg font-bold text-foreground">₹{match.prizePool}</p>
          </div>
           <Button asChild size="sm">
             <Link href={`/match/${match.id}`}>
                {isFull ? 'Spectate' : 'Join'}
             </Link>
          </Button>
        </CardFooter>
      </Card>
    );
}

const CategoryCard = ({ title, href, icon: Icon, imageId }: { title: string, href: string, icon: React.ElementType, imageId: string }) => {
    const image = PlaceHolderImages.find(p => p.id === imageId);
    return (
        <Link href={href} className="relative block rounded-lg overflow-hidden h-28 group border hover:border-primary/50 transition-colors">
            {image && (
                 <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                 />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <Icon className="h-6 w-6 mb-1 text-primary"/>
                <p className="text-sm font-bold">{title}</p>
            </div>
        </Link>
    )
}

function DashboardClientContent() {
    const { user, userData, loading } = useUser();

    const { data: openMatches, loading: openMatchesLoading } = useCollection<Match>('matches', {
        where: ['status', '==', 'waiting'],
        orderBy: ['createdAt', 'desc'],
        limit: 20
    });

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="bg-card text-foreground p-4 sm:p-6 border-b">
                <header className="flex justify-between items-center mb-4">
                    {loading ? <Skeleton className="h-7 w-32"/> : <h1 className="text-xl sm:text-2xl font-bold">Hi, {userData?.displayName || 'Player'}!</h1>}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="ghost" size="icon" asChild><Link href="/messages"><MessageCircle className="h-5 w-5" /></Link></Button>
                        <Button variant="ghost" size="icon" asChild><Link href="/notifications"><Bell className="h-5 w-5" /></Link></Button>
                    </div>
                </header>

                <div className="bg-background/80 p-4 rounded-lg border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Wallet Balance</p>
                            {loading ? <Skeleton className="h-8 w-36 mt-1"/> : <p className="text-3xl font-bold">₹{userData?.walletBalance?.toLocaleString('en-IN') ?? '0.00'}</p>}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="flex-1" asChild><Link href="/add-money">Add Money</Link></Button>
                            <Button className="flex-1" asChild><Link href="/create-match">Create Match</Link></Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Category Links with improved responsive grid */}
                <section>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <CategoryCard title="KYC" href="/kyc" icon={ShieldCheck} imageId="kyc_card" />
                        <CategoryCard title="Refer & Earn" href="/refer" icon={Gift} imageId="hero" />
                        <CategoryCard title="My Wallet" href="/wallet/history" icon={Wallet} imageId="wallet_icon" />
                        <CategoryCard title="My Matches" href="/matches/my-matches" icon={Gamepad2} imageId="tournament_card" />
                    </div>
                </section>

                {/* Open Matches - NOW A RESPONSIVE GRID */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-primary">Open Matches</h2>
                        <Button variant="link" asChild>
                            <Link href="/matches">View All</Link>
                        </Button>
                    </div>
                    {openMatchesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <Skeleton className="w-full h-56 rounded-lg" />
                            <Skeleton className="w-full h-56 rounded-lg" />
                            <Skeleton className="w-full h-56 rounded-lg hidden sm:block" />
                            <Skeleton className="w-full h-56 rounded-lg hidden lg:block" />
                        </div>
                    ): openMatches && openMatches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {openMatches.map(match => <MatchCard key={match.id} match={match}/>)}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg bg-card/50">
                            <h3 className="text-lg font-semibold">No Open Matches</h3>
                            <p className="text-muted-foreground mt-1 mb-4 text-sm">Be the first to create a new challenge!</p>
                            <Button asChild>
                                <Link href="/create-match">Create a Match</Link>
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

const NewsCarousel = () => {
    const { data: announcements, loading } = useCollection<Announcement>('announcements', {
      orderBy: ['createdAt', 'desc'],
      limit: 5,
    });

    if (loading) {
      return (
        <section className="px-4 sm:px-6">
          <Skeleton className="h-8 w-48 mb-3" />
          <div className="pl-4">
             <Skeleton className="h-40 w-full md:w-1/2 lg:w-1/3" />
          </div>
        </section>
      )
    }

    if (!announcements || announcements.length === 0) {
        return null;
    }

    const getCardClasses = (type: Announcement['type']) => {
        switch (type) {
            case 'Promo': return 'bg-gradient-to-br from-blue-500 to-blue-700 text-white';
            case 'Update': return 'bg-gradient-to-br from-slate-600 to-slate-800 text-white';
            case 'Warning': return 'bg-gradient-to-br from-red-500 to-red-700 text-white';
            default: return 'bg-gradient-to-br from-violet-500 to-violet-700 text-white';
        }
    };

    return (
        <section>
             <h2 className="text-lg font-bold mb-3 px-4 sm:px-6">News & Updates</h2>
             <Carousel
                opts={{
                    align: "start",
                    loop: announcements.length > 1,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {announcements.map((ann) => (
                        <CarouselItem key={ann.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Card className={cn("border-0 shadow-lg", getCardClasses(ann.type))}>
                                    <CardContent className="p-6">
                                        <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0">{ann.type}</Badge>
                                        <h3 className="font-bold text-lg mb-2">{ann.title}</h3>
                                        <p className="text-sm text-white/90">{ann.content}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                 {announcements.length > 2 && (
                    <>
                        <CarouselPrevious className="hidden sm:flex ml-12" />
                        <CarouselNext className="hidden sm:flex mr-12" />
                    </>
                )}
            </Carousel>
        </section>
    );
};


export default function DashboardPage() {
    return (
        <AppShell>
            <div className="space-y-8">
                <DashboardClientContent />
                <NewsCarousel />
            </div>
        </AppShell>
    );
}
