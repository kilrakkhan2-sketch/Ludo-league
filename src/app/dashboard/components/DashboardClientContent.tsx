
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import type { Announcement, Match } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
      <Card className="relative overflow-hidden flex flex-col hover:shadow-lg transition-shadow w-full bg-card border border-border">
        <Image
            src="https://firebasestorage.googleapis.com/v0/b/studio-4431476254-c1156.appspot.com/o/appImages%2F26323-removebg-preview.png?alt=media&token=6ffa1383-0a70-44ca-acce-98d738ef99ed"
            alt="LudoLeague Watermark"
            width={80}
            height={80}
            className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-5 pointer-events-none"
        />
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

export default function DashboardClientContent() {
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
                            {loading ? <Skeleton className="h-8 w-36 mt-1"/> : <p className="text-3xl font-bold">₹{userData?.wallet?.balance?.toLocaleString('en-IN') ?? '0.00'}</p>}
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
