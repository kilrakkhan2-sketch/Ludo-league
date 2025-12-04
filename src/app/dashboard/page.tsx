
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Trophy } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const myMatches = [
   {
    id: 3,
    name: "Weekend Warriors",
    entryFee: 50,
    players: 4,
    maxPlayers: 4,
    prize: 190,
    status: "Ongoing"
  },
  {
    id: 5,
    name: "Quick Skirmish",
    entryFee: 25,
    players: 3,
    maxPlayers: 4,
    prize: 90,
    status: "Waiting"
  },
]

const openMatches = [
  {
    id: 1,
    name: "Beginner's Luck",
    entryFee: 10,
    players: 2,
    maxPlayers: 4,
    prize: 35,
    status: "Open"
  },
  {
    id: 2,
    name: "Pro Arena",
    entryFee: 100,
    players: 1,
    maxPlayers: 2,
    prize: 180,
    status: "Open"
  },
  {
    id: 6,
    name: "Evening Duel",
    entryFee: 20,
    players: 1,
    maxPlayers: 2,
    prize: 38,
    status: "Open"
  },
];

const fullMatches = [
   {
    id: 4,
    name: "High Rollers Only",
    entryFee: 500,
    players: 2,
    maxPlayers: 2,
    prize: 950,
    status: "Full"
  },
]

const MatchCard = ({ match }: { match: (typeof openMatches)[0] }) => (
  <Card className="flex flex-col hover:shadow-lg transition-shadow">
    <CardHeader className="p-4">
       <div className="flex justify-between items-start">
        <div>
            <CardTitle className="text-lg">{match.name}</CardTitle>
            <CardDescription>
                Entry: <span className="font-bold text-primary">₹{match.entryFee}</span>
            </CardDescription>
        </div>
        <Badge
          variant={
            match.players === match.maxPlayers ? "destructive" : "secondary"
          }
        >
          {match.status}
        </Badge>
       </div>
    </CardHeader>
    <CardContent className="p-4 pt-0 flex-grow">
      <div className="flex items-center -space-x-2 mb-2">
        {Array.from({ length: match.players }).map((_, i) => (
          <Avatar key={i} className="h-6 w-6 border-2 border-background">
            <AvatarImage
              src={`https://picsum.photos/seed/player${match.id}-${i}/40/40`}
            />
            <AvatarFallback>P{i + 1}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Users className="h-4 w-4" />
          <span>
            {match.players} / {match.maxPlayers} Players
          </span>
        </div>
    </CardContent>
    <CardFooter className="flex justify-between items-center bg-muted/50 py-3 px-4">
      <div className="flex items-center gap-1.5">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <p className="text-lg font-bold">₹{match.prize}</p>
      </div>
      <Button disabled={match.players === match.maxPlayers}>Join</Button>
    </CardFooter>
  </Card>
);

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Find a Match</h1>
            <p className="text-muted-foreground">
              Join an existing match or create your own.
            </p>
          </div>
          <Button asChild>
            <Link href="/create-match">Create a Match</Link>
          </Button>
        </div>

        {/* My Matches Section */}
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold font-headline">My Matches</h2>
                <p className="text-muted-foreground">Your active games. You can have a maximum of 3 active matches.</p>
            </div>
            {myMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {myMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't joined or created any matches yet.</p>
                </div>
            )}
        </div>

        <Separator />

        {/* Open Matches Section */}
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold font-headline">Open Matches</h2>
                <p className="text-muted-foreground">Available matches you can join right now.</p>
            </div>
             {openMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {openMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
             ) : (
                <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No open matches available. Why not create one?</p>
                </div>
             )}
        </div>
        
        <Separator />

        {/* Full Matches Section */}
        <div className="space-y-4">
             <div>
                <h2 className="text-2xl font-bold font-headline">Full & Ongoing Matches</h2>
                <p className="text-muted-foreground">Matches that are already full or in progress.</p>
            </div>
            {fullMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                    {fullMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            ) : (
                 <p className="text-muted-foreground text-center py-8">
                  No full matches right now.
                </p>
            )}
        </div>

      </div>
    </AppShell>
  );
}
