
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import type { Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { Bell, MessageCircle, Gift, ShieldCheck, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Users, Trophy } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// This component is now self-contained within DashboardClientContent
const PlayerAvatarList = ({ playerIds, maxPlayers }: { playerIds: string[], maxPlayers: number }) => {
    const playerSlots = Array.from({ length: maxPlayers });

    return (
        <div className="flex items-center space-x-2">
            {playerSlots.map((_, index) => {
                const playerId = playerIds[index];
                if (playerId) {
                    return <PlayerAvatar key={playerId} playerId={playerId} />;
                }
                return (
                    <Avatar key={index} className="h-8 w-8 border-2 border-dashed">
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                );
            })}
        </div>
    );
};

const PlayerAvatar = ({ playerId }: { playerId: string }) => {
    const { data: user, loading } = useDoc(`users/${playerId}`);
    if (loading) return <Skeleton className="h-8 w-8 rounded-full" />;
    return (
        <Avatar className="h-8 w-8 border-2">
            <AvatarImage src={user?.photoURL} alt={user?.displayName} />
            <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
        </Avatar>
    );
};


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
            case 'COMPLETED': return 'secondary';
            case 'disputed': return 'destructive';
            default: return 'default';
        }
    }

    return (
      <Card className="relative overflow-hidden flex flex-col hover:shadow-lg transition-shadow w-full bg-card border border-border">
        <Image
            src="/logo.png"
            alt="LudoLeague Watermark"
            width={100}
            height={100}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
        />
        <CardHeader className="p-3 sm:p-4">
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
        <CardContent className="p-3 sm:p-4 pt-0 flex-grow space-y-3">
          <PlayerAvatarList playerIds={match.players} maxPlayers={match.maxPlayers} />
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {match.players.length} / {match.maxPlayers} Players
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-3 sm:px-4 rounded-b-lg">
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
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
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
    const { user, userData, loading } = useUser() ?? {};
    const { useDoc } = useFirebase(); // Make sure useDoc is available

    const { data: openMatches, loading: openMatchesLoading } = useCollection<Match>('matches', {
        where: ['status', '==', 'waiting'],
        orderBy: ['createdAt', 'desc'],
        limit: 20
    });

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="bg-card text-foreground px-4 pt-4 pb-0">
                <header className="flex justify-between items-center">
                    {loading ? <Skeleton className="h-7 w-32"/> : <h1 className="text-xl sm:text-2xl font-bold">Hi, {userData?.displayName || 'Player'}!</h1>}
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild><Link href="/messages"><MessageCircle className="h-5 w-5" /></Link></Button>
                        <Button variant="ghost" size="icon" asChild><Link href="/notifications"><Bell className="h-5 w-5" /></Link></Button>
                    </div>
                </header>
            </div>

            <div className="px-4 space-y-6">
                 {/* Combined Wallet and Actions Card */}
                <Card className="bg-background/80 border">
                    <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                                {loading ? <Skeleton className="h-8 w-36 mt-1"/> : <p className="text-2xl font-bold">₹{userData?.walletBalance?.toLocaleString('en-IN') ?? '0.00'}</p>}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button variant="outline" className="flex-1" asChild><Link href="/add-money">Add Money</Link></Button>
                                <Button className="flex-1" asChild><Link href="/create-match">Create Match</Link></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Category Links */}
                <section>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <CategoryCard title="KYC" href="/kyc" icon={ShieldCheck} imageId="kyc_card" />
                        <CategoryCard title="Refer & Earn" href="/refer" icon={Gift} imageId="hero" />
                        <CategoryCard title="My Wallet" href="/wallet" icon={Trophy} imageId="wallet_icon" />
                        <CategoryCard title="My Matches" href="/matches/my-matches" icon={Gamepad2} imageId="tournament_card" />
                    </div>
                </section>

                {/* Open Matches */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-primary">Open Matches</h2>
                        <Button variant="link" asChild>
                            <Link href="/matches">View All</Link>
                        </Button>
                    </div>
                    {openMatchesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <Skeleton className="w-full h-52 rounded-lg" />
                            <Skeleton className="w-full h-52 rounded-lg" />
                            <Skeleton className="w-full h-52 rounded-lg hidden sm:block" />
                            <Skeleton className="w-full h-52 rounded-lg hidden lg:block" />
                        </div>
                    ): openMatches && openMatches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {openMatches.map(match => <MatchCard key={match.id} match={match}/>)}
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-card/50">
                            <h3 className="text-base font-semibold">No Open Matches</h3>
                            <p className="text-muted-foreground mt-1 mb-3 text-sm">Be the first to create a new challenge!</p>
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
