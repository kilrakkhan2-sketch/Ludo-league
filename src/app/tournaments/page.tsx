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
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, Users, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const tournaments = [
  {
    id: 1,
    name: "Ludo Grand Championship",
    prizePool: 10000,
    entryFee: 200,
    startDate: "August 1, 2024",
    status: "Upcoming",
    players: 48,
    maxPlayers: 64,
  },
  {
    id: 2,
    name: "Weekly Blitz",
    prizePool: 1500,
    entryFee: 50,
    startDate: "July 25, 2024",
    status: "Live",
    players: 32,
    maxPlayers: 32,
  },
  {
    id: 3,
    name: "Rookie Rumble",
    prizePool: 500,
    entryFee: 10,
    startDate: "July 22, 2024",
    status: "Completed",
    players: 16,
    maxPlayers: 16,
  },
];

const tournamentCardImage = PlaceHolderImages.find(
  (p) => p.id === "tournament_card"
);

export default function TournamentsPage() {
  return (
    <AppShell>
      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Tournaments</h1>
            <p className="text-muted-foreground">
              Compete for bigger prizes in our tournaments.
            </p>
          </div>
          <Button asChild>
            <Link href="/create-tournament"><PlusCircle className="mr-2 h-4 w-4" />Host Tournament</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-card">
              {tournamentCardImage && (
                <div className="relative h-40 w-full">
                  <Image
                    src={`${tournamentCardImage.imageUrl}&seed=${tournament.id}`}
                    alt={tournamentCardImage.description}
                    data-ai-hint={tournamentCardImage.imageHint}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge
                    className="absolute top-3 right-3"
                    variant={
                      tournament.status === "Live" ? "default" : "secondary"
                    }
                  >
                    {tournament.status}
                  </Badge>
                   <div className="absolute bottom-3 left-4 text-primary-foreground">
                        <h3 className="font-bold text-lg">{tournament.name}</h3>
                        <p className="text-xs opacity-80">Entry: ₹{tournament.entryFee}</p>
                   </div>
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">
                        ₹{tournament.prizePool.toLocaleString()}
                      </span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold text-foreground">
                        {tournament.players}/{tournament.maxPlayers}
                      </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-5 w-5" />
                  <span>Starts: {tournament.startDate}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  disabled={tournament.status === "Completed"}
                  variant={tournament.status === "Live" ? "destructive" : "default"}
                >
                  {tournament.status === "Upcoming" && "Register Now"}
                  {tournament.status === "Live" && "View Live"}
                  {tournament.status === "Completed" && "View Results"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
