
import Image from "next/image";
import { CreateMatchDialog } from "@/components/app/create-match-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMatches } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Swords, Users, Star, History } from "lucide-react";
import Link from "next/link";
import { UserNav } from "@/components/app/user-nav";

const MatchCard = ({ match }: { match: (typeof mockMatches)[0] }) => (
    <Card key={match.id} className="flex flex-col">
        <CardHeader className="p-4">
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
                <Swords className="h-5 w-5 text-primary" />
                <span>Prize: ₹{match.prizePool}</span>
            </CardTitle>
            <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", {
                "bg-green-100 text-green-800": match.status === 'waiting',
                "bg-blue-100 text-blue-800": match.status === 'in-progress',
                "bg-gray-100 text-gray-800": match.status === 'completed',
                "bg-red-100 text-red-800": match.status === 'disputed',
            })}>
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </div>
            </div>
            <CardDescription>Entry: ₹{match.entryFee}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
                {match.players.map((player, index) => (
                <Avatar key={player.id} className={`h-8 w-8 border-2 border-background ${index > 0 ? '-ml-3' : ''}`}>
                    <AvatarImage src={player.avatarUrl} alt={player.name} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                ))}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{match.players.length}/{match.maxPlayers}</span>
            </div>
            </div>
        </CardContent>
        <CardFooter className="p-2 pt-0 border-t mt-2">
            <Button asChild className="w-full h-9" variant={match.status === 'waiting' ? 'accent' : 'default'} disabled={match.status !== 'waiting' && match.status !== 'in-progress' && match.status !== 'disputed'}>
            <Link href={`/match/${match.id}`}>
                {match.status === 'waiting' ? 'Join Match' : 'View Match'}
            </Link>
            </Button>
        </CardFooter>
    </Card>
);


export default function DashboardPage() {
    // Assuming user-1 has joined these matches. In a real app, this would be dynamic.
    const myMatches = mockMatches.filter(m => m.players.some(p => p.id === 'user-1'));
    const openMatches = mockMatches.filter(m => m.status === 'waiting' && !myMatches.find(myM => myM.id === m.id));
    const ongoingMatches = mockMatches.filter(m => m.status === 'in-progress' && !myMatches.find(myM => myM.id === m.id));

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Match Lobby</h2>
        <div className="flex items-center space-x-2">
          <div className="md:hidden">
            <UserNav />
          </div>
          <CreateMatchDialog />
        </div>
      </div>
      <div className="flex flex-col gap-8">
        
        {myMatches.length > 0 && (
            <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500"/> My Matches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            </section>
        )}

        <section>
            <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                <Swords className="h-6 w-6 text-primary"/> Open Matches
            </h3>
            {openMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {openMatches.map((match) => (
                       <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No open matches available right now. Why not create one?</p>
            )}
        </section>

        {ongoingMatches.length > 0 && (
             <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <History className="h-6 w-6 text-blue-500"/> Ongoing Matches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ongoingMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            </section>
        )}

      </div>
    </>
  );
}
