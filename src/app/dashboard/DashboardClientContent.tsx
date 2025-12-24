
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useCollection, useUser, useDoc } from "@/firebase";
import type { Match, UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageCircle, PlusCircle, Swords, Wallet, Gift, ShieldCheck, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy } from "lucide-react";
import { useMemo } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { PlayerAvatarList } from "@/components/matches/PlayerAvatarList";

const MatchCard = ({ match }: { match: Match }) => {
    const isFull = match.players.length >= match.maxPlayers;

    const getStatusVariant = (status: Match['status']) => {
        switch (status) {
            case 'open': return isFull ? 'destructive' : 'outline';
            case 'ongoing': return 'default';
            case 'completed': return 'secondary';
            case 'disputed': return 'destructive';
            case 'processing': return 'default';
            default: return 'default';
        }
    }

    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow shrink-0 w-72 bg-card border border-border">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg truncate text-primary">{match.title}</CardTitle>
              <CardDescription>
                Entry: <span className="font-bold text-foreground">₹{match.entryFee}</span>
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(match.status)}
              className="capitalize"
            >
              {isFull && match.status === 'open' ? 'Full' : match.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="mb-2">
            <PlayerAvatarList playerIds={match.players} maxPlayers={match.maxPlayers} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>
              {match.players.length} / {match.maxPlayers} Players
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-background/30 py-3 px-4 rounded-b-lg">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">₹{match.prizePool}</p>
          </div>
           <Button asChild>
             <Link href={`/match/${match.id}`}>
                View
             </Link>
          </Button>
        </CardFooter>
      </Card>
    );
}

const CategoryCard = ({ title, href, icon: Icon, imageId }: { title: string, href: string, icon: React.ElementType, imageId: string }) => {
    const image = PlaceHolderImages.find(p => p.id === imageId);
    return (
        <Link href={href} className="relative block rounded-lg overflow-hidden h-28 group border border-border/50 hover:border-border transition-colors">
            {image && (
                 <Image
                    src={image.imageUrl}
                    alt={image.description}
                    data-ai-hint={image.imageHint}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                 />
            )}
            <div className="absolute inset-0 bg-background/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground p-2">
                <Icon className="h-8 w-8 mb-1 text-primary"/>
                <p className="text-sm font-bold text-center">{title}</p>
            </div>
        </Link>
    )
}

function DashboardClientContent() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);

    const { data: openMatches, loading: openMatchesLoading } = useCollection<Match>('matches', {
        where: ['status', '==', 'open'],
        orderBy: ['createdAt', 'desc'],
        limit: 20
    });
    
    const loading = userLoading || profileLoading;

    return (
        <AppShell pageTitle="Dashboard">
            <div className="min-h-screen">
                {/* Header Section */}
                <div className="bg-card text-foreground p-4 sm:p-6 border-b border-border/50">
                    <header className="flex justify-between items-center mb-4">
                        {loading ? <Skeleton className="h-7 w-32 bg-white/20"/> : <h1 className="text-xl sm:text-2xl font-bold">Hi, {profile?.displayName || 'Player'}!</h1>}
                        <div className="flex items-center gap-4">
                           <Link href="/messages"><MessageCircle className="h-6 w-6 text-foreground/80 hover:text-primary transition-colors" /></Link>
                           <Link href="/notifications"><Bell className="h-6 w-6 text-foreground/80 hover:text-primary transition-colors" /></Link>
                        </div>
                    </header>

                    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/30">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                                {loading ? <Skeleton className="h-8 w-36 mt-1 bg-white/20"/> : <p className="text-3xl font-bold">₹{profile?.walletBalance?.toLocaleString() || '0.00'}</p>}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button variant="secondary" className="flex-1" asChild>
                                    <Link href="/add-money">
                                        Add Money
                                    </Link>
                                </Button>
                                <Button className="flex-1" asChild>
                                    <Link href="/create-match">
                                        Create Match
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                    {/* Category Links */}
                    <section>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <CategoryCard title="KYC" href="/kyc" icon={ShieldCheck} imageId="kyc_card" />
                            <CategoryCard title="Refer & Earn" href="/refer" icon={Gift} imageId="hero" />
                            <CategoryCard title="My Wallet" href="/wallet/history" icon={Wallet} imageId="wallet_icon" />
                            <CategoryCard title="My Matches" href="/matches/my-matches" icon={Gamepad2} imageId="tournament_card" />
                        </div>
                    </section>

                    {/* Open Matches */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-bold text-primary">Open Matches</h2>
                            <Link href="/matches/open" className="text-sm font-semibold text-primary/80 hover:text-primary">
                                View All
                            </Link>
                        </div>
                        {openMatchesLoading ? (
                            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                                <Skeleton className="shrink-0 w-72 h-56 rounded-lg bg-card" />
                                <Skeleton className="shrink-0 w-72 h-56 rounded-lg bg-card" />
                                <Skeleton className="shrink-0 w-72 h-56 rounded-lg bg-card d-none d-sm-block" />
                            </div>
                        ): openMatches.length > 0 ? (
                            <div className="overflow-x-auto">
                                <div className="flex space-x-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                                {openMatches.map(match => <MatchCard key={match.id} match={match}/>)}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-border/50 rounded-lg bg-card">
                                <p className="text-muted-foreground mb-2">No open matches available right now.</p>
                                <Button asChild>
                                <Link href="/create-match">Create the first match!</Link>
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppShell>
    );
}

export default DashboardClientContent;
