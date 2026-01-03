import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockMatches } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Crown, Swords, Users } from "lucide-react";

export default function AdminMatchesPage() {
  const completedMatches = mockMatches.filter(
    (match) => match.status === "completed" && match.results
  );

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">
        Match Results
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Completed Matches</CardTitle>
          <CardDescription>
            Review results and screenshots for completed matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {completedMatches.map((match) => (
              <AccordionItem key={match.id} value={match.id}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex flex-col items-start">
                      <p className="font-semibold">Match ID: {match.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Prize: ₹{match.prizePool}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{match.players.length} Players</span>
                        <Badge variant="outline">Completed</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Results:</h4>
                    {match.results?.map((result, index) => {
                      const player = match.players.find(
                        (p) => p.id === result.userId
                      );
                      return (
                        <div key={index} className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={player?.avatarUrl} />
                                        <AvatarFallback>{player?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{player?.name}</p>
                                        <p className="text-sm text-muted-foreground">User ID: {player?.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-2 text-lg font-bold">
                                        <Crown className={cn("h-5 w-5", result.position === 1 ? "text-yellow-500" : "text-muted-foreground")} />
                                        Position: {result.position}
                                    </div>
                                    <Badge variant={result.status === 'win' ? 'default' : 'destructive'} className={cn({"bg-green-500/80": result.status === 'win'})}>
                                        {result.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-medium mb-2">Submitted Screenshot</p>
                                <Image
                                    src={result.screenshotUrl}
                                    alt={`Screenshot from ${player?.name}`}
                                    width={300}
                                    height={200}
                                    className="rounded-md object-cover border-2"
                                />
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
