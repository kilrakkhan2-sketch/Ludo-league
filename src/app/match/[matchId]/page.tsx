
"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";
import Link from "next/link";

const match = {
  id: 1,
  name: "Beginner's Luck",
  entryFee: 10,
  players: [
    { id: 1, name: "LudoKing99", avatar: "https://picsum.photos/seed/user-avatar/100/100" },
    { id: 2, name: "DiceMaster", avatar: "https://picsum.photos/seed/player1-1/40/40" },
  ],
  maxPlayers: 4,
  prize: 35,
  status: "Open"
};

const messages = [
    {id: 1, userId: 1, name: "LudoKing99", text: "Welcome everyone! The Ludo King code will be shared here once we are full.", timestamp: "10:30 AM"},
    {id: 2, userId: 2, name: "DiceMaster", text: "Hi! Ready to play", timestamp: "10:31 AM"},
];

export default function MatchLobbyPage({ params }: { params: { matchId: string } }) {
  return (
    <AppShell>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle>{match.name}</CardTitle>
              <CardDescription>
                Entry: <span className="font-bold text-primary">{match.entryFee} credits</span> | Prize: <span className="font-bold text-success">{match.prize} credits</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <span>{match.players.length} / {match.maxPlayers} Players</span>
                    </div>
                    <Badge variant={match.status === "Open" ? "secondary" : "default"}>{match.status}</Badge>
                </div>
            </CardContent>
             <CardFooter>
                 <Button className="w-full" disabled={match.players.length === match.maxPlayers && match.status === "Open"}>
                    {match.status === "Open" ? 'Start Match' : 'Match In Progress'}
                </Button>
            </CardFooter>
          </Card>

          {/* Match Chat */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Match Chat</CardTitle>
              <CardDescription>Communicate with other players.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-72 w-full pr-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div key={message.id} className={`flex items-end gap-2 ${message.userId === 1 ? 'justify-end' : ''}`}>
                      {message.userId !== 1 && (
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/player${message.userId}/40/40`} />
                            <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg p-3 max-w-xs ${message.userId === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs text-right opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                      {message.userId === 1 && (
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/user-avatar/100/100`} />
                            <AvatarFallback>Me</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="relative w-full">
                <Input placeholder="Type a message..." className="pr-12" />
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Players List */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.players.map(player => (
                 <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.id === 1 ? 'Creator' : 'Joined'}</p>
                        </div>
                    </div>
                 </div>
              ))}
              {Array.from({ length: match.maxPlayers - match.players.length}).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                    <Avatar>
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-muted-foreground">Waiting for player...</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
