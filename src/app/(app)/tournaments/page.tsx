
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTournaments } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Calendar, Users, Trophy, Ticket, CircleDotDashed, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TournamentCard = ({ tournament }: { tournament: (typeof mockTournaments)[0] }) => (
    <Card className="flex flex-col overflow-hidden">
        <div className="relative h-40 w-full">
            <Image
                src={tournament.bannerImageUrl}
                alt={`${tournament.name} banner`}
                fill
                className="object-cover"
            />
            <Badge 
                className={cn("absolute top-2 right-2 text-xs font-bold", {
                    "bg-yellow-500 text-white": tournament.status === 'upcoming',
                    "bg-red-600 text-white animate-pulse": tournament.status === 'live',
                    "bg-green-600 text-white": tournament.status === 'completed'
                })}
            >
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </Badge>
        </div>
        <CardHeader>
            <CardTitle>{tournament.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1">
                <Calendar className="h-4 w-4" />
                <span>Starts: {new Date(tournament.startTime).toLocaleString()}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Ticket className="h-4 w-4" /> Entry Fee</span>
                <span className="font-semibold">₹{tournament.entryFee}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Trophy className="h-4 w-4" /> Prize Pool</span>
                <span className="font-semibold">₹{tournament.prizePool}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Slots</span>
                <span className="font-semibold">{tournament.filledSlots} / {tournament.totalSlots}</span>
            </div>
        </CardContent>
        <CardFooter>
            {tournament.status === 'upcoming' && tournament.filledSlots < tournament.totalSlots && (
                 <Button asChild className="w-full" variant="accent">
                    <Link href={`/tournaments/${tournament.id}`}>Join Now</Link>
                </Button>
            )}
             {tournament.status === 'upcoming' && tournament.filledSlots >= tournament.totalSlots && (
                 <Button className="w-full" variant="secondary" disabled>Slots Full</Button>
            )}
            {tournament.status === 'live' && (
                <Button asChild className="w-full" variant="destructive">
                    <Link href={`/tournaments/${tournament.id}`}>Watch Live</Link>
                </Button>
            )}
            {tournament.status === 'completed' && (
                 <Button asChild className="w-full" variant="outline">
                    <Link href={`/tournaments/${tournament.id}`}>View Results</Link>
                </Button>
            )}
        </CardFooter>
    </Card>
);

export default function TournamentsPage() {
    const upcomingTournaments = mockTournaments.filter(t => t.status === 'upcoming');
    const liveTournaments = mockTournaments.filter(t => t.status === 'live');
    const completedTournaments = mockTournaments.filter(t => t.status === 'completed');

  return (
    <>
        <div className="flex items-center justify-between space-y-2 mb-4">
            <h2 className="text-3xl font-bold tracking-tight">Tournaments</h2>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">
                    <Calendar className="h-4 w-4 mr-2"/> Upcoming
                </TabsTrigger>
                <TabsTrigger value="live">
                    <CircleDotDashed className="h-4 w-4 mr-2"/> Live
                </TabsTrigger>
                <TabsTrigger value="completed">
                    <CheckCircle2 className="h-4 w-4 mr-2"/> Completed
                </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
                {upcomingTournaments.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {upcomingTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No upcoming tournaments right now.</p>
                )}
            </TabsContent>
            <TabsContent value="live">
                 {liveTournaments.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {liveTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No live tournaments right now.</p>
                )}
            </TabsContent>
            <TabsContent value="completed">
                 {completedTournaments.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {completedTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No completed tournaments found.</p>
                )}
            </TabsContent>
        </Tabs>
    </>
  );
}
