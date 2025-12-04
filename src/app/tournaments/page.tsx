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
import { Award, Calendar } from "lucide-react";
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
  },
  {
    id: 2,
    name: "Weekly Blitz",
    prizePool: 1500,
    entryFee: 50,
    startDate: "July 25, 2024",
    status: "Live",
  },
  {
    id: 3,
    name: "Rookie Rumble",
    prizePool: 500,
    entryFee: 10,
    startDate: "July 22, 2024",
    status: "Completed",
  },
];

const tournamentCardImage = PlaceHolderImages.find(
  (p) => p.id === "tournament_card"
);

export default function TournamentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Tournaments</h1>
            <p className="text-muted-foreground">
              Compete for bigger prizes in our tournaments.
            </p>
          </div>
          <Button asChild>
            <Link href="/create-tournament">Host a Tournament</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {tournamentCardImage && (
                <div className="relative h-48 w-full">
                  <Image
                    src={`${tournamentCardImage.imageUrl}&seed=${tournament.id}`}
                    alt={tournamentCardImage.description}
                    data-ai-hint={tournamentCardImage.imageHint}
                    fill
                    className="object-cover"
                  />
                  <Badge
                    className="absolute top-3 right-3"
                    variant={
                      tournament.status === "Live" ? "default" : "secondary"
                    }
                  >
                    {tournament.status}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{tournament.name}</CardTitle>
                <CardDescription>
                  Entry Fee: {tournament.entryFee} credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">
                    Prize Pool: {tournament.prizePool} credits
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>Starts: {tournament.startDate}</span>
                </div>
              </CardContent>
              <CardFooter>
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
