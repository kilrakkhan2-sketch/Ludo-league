import Image from "next/image";
import { SubmitResultForm } from "@/components/app/submit-result-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMatches, mockUsers } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Copy, Crown, ShieldCheck, Swords, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MatchPage({ params }: { params: { id: string } }) {
  const match = mockMatches.find(m => m.id === params.id) ?? mockMatches[1];

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Match Details</h2>
        <div className={cn("text-lg font-semibold px-4 py-2 rounded-lg", {
            "bg-green-100 text-green-800": match.status === 'waiting',
            "bg-blue-100 text-blue-800": match.status === 'in-progress',
            "bg-gray-100 text-gray-800": match.status === 'completed',
        })}>
            Status: {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            {match.status === 'in-progress' && match.roomCode && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-primary"/> Ludo King Room Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                        <p className="text-2xl font-mono tracking-widest font-bold text-primary">{match.roomCode}</p>
                        <Button variant="ghost" size="icon">
                            <Copy className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </CardContent>
                 </Card>
            )}
           
            <SubmitResultForm matchId={match.id} />
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Match Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4"/> Entry Fee</span>
                        <span className="font-semibold">₹{match.entryFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Crown className="h-4 w-4"/> Prize Pool</span>
                        <span className="font-semibold">₹{match.prizePool}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> Players</span>
                        <span className="font-semibold">{match.players.length} / {match.maxPlayers}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {match.players.map(player => (
                        <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={player.avatarUrl} />
                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{player.name}</p>
                                    <p className="text-sm text-muted-foreground">Win Rate: {player.winRate}%</p>
                                </div>
                            </div>
                            <Badge variant="outline"><ShieldCheck className="h-3 w-3 mr-1 text-green-500"/> Verified</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
