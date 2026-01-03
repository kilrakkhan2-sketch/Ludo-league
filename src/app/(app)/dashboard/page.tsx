import Image from "next/image";
import { CreateMatchDialog } from "@/components/app/create-match-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMatches } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Swords, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Match Lobby</h2>
        <div className="flex items-center space-x-2">
          <CreateMatchDialog />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockMatches.map((match) => (
          <Card key={match.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  <span>Prize: ₹{match.prizePool}</span>
                </CardTitle>
                <div className={cn("text-xs font-semibold px-2 py-1 rounded-full", {
                  "bg-green-100 text-green-800": match.status === 'waiting',
                  "bg-blue-100 text-blue-800": match.status === 'in-progress',
                  "bg-gray-100 text-gray-800": match.status === 'completed',
                })}>
                  {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                </div>
              </div>
              <CardDescription>Entry: ₹{match.entryFee}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
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
            <CardFooter>
              <Button asChild className="w-full" variant={match.status === 'waiting' ? 'accent' : 'default'} disabled={match.status !== 'waiting'}>
                <Link href={`/match/${match.id}`}>
                  {match.status === 'waiting' ? 'Join Match' : 'View Match'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
