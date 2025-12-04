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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Filter, Users, Eye } from "lucide-react";
import Link from "next/link";

const matches = [
  {
    id: 1,
    name: "Beginner's Luck",
    entryFee: 10,
    players: 2,
    maxPlayers: 4,
    prize: 35,
  },
  {
    id: 2,
    name: "Pro Arena",
    entryFee: 100,
    players: 1,
    maxPlayers: 2,
    prize: 180,
  },
  {
    id: 3,
    name: "Weekend Warriors",
    entryFee: 50,
    players: 4,
    maxPlayers: 4,
    prize: 190,
  },
  {
    id: 4,
    name: "High Rollers Only",
    entryFee: 500,
    players: 0,
    maxPlayers: 2,
    prize: 950,
  },
  {
    id: 5,
    name: "Quick Skirmish",
    entryFee: 25,
    players: 3,
    maxPlayers: 4,
    prize: 90,
  },
  {
    id: 6,
    name: "Evening Duel",
    entryFee: 20,
    players: 1,
    maxPlayers: 2,
    prize: 38,
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Find a Match</h1>
            <p className="text-muted-foreground">
              Join an existing match and start playing.
            </p>
          </div>
          <Button asChild>
            <Link href="/create-match">Create a Match</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input placeholder="Search by match name..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Entry Fee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low (₹1-50)</SelectItem>
                  <SelectItem value="medium">Medium (₹51-200)</SelectItem>
                  <SelectItem value="high">High (₹201+)</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" variant="secondary">Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{match.name}</CardTitle>
                <CardDescription>
                  Entry Fee:{" "}
                  <span className="font-bold text-primary">
                    ₹{match.entryFee}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {match.players} / {match.maxPlayers} Players
                    </span>
                  </div>
                  <Badge
                    variant={
                      match.players === match.maxPlayers
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {match.players === match.maxPlayers ? "Full" : "Open"}
                  </Badge>
                </div>
                <div className="flex items-center mt-4 -space-x-2">
                  {Array.from({ length: match.players }).map((_, i) => (
                    <Avatar
                      key={i}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarImage
                        src={`https://picsum.photos/seed/player${match.id}-${i}/40/40`}
                      />
                      <AvatarFallback>P{i + 1}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/50 py-3">
                 <p className="text-lg font-bold">Prize: ₹{match.prize}</p>
                <div className="flex gap-2">
                   <Button asChild variant="secondary" size="icon">
                    <Link href={`/match/${match.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Match</span>
                    </Link>
                  </Button>
                  <Button disabled={match.players === match.maxPlayers}>
                    Join
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
