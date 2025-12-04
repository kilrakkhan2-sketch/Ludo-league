"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquarePlus, UserPlus, UserX } from "lucide-react";

const friends = [
  {
    id: 1,
    name: "Alice",
    avatar: "https://picsum.photos/seed/friend1/100/100",
    online: true,
  },
  {
    id: 2,
    name: "Bob",
    avatar: "https://picsum.photos/seed/friend2/100/100",
    online: false,
  },
  {
    id: 3,
    name: "Charlie",
    avatar: "https://picsum.photos/seed/friend3/100/100",
    online: true,
  },
];

const requests = [
  {
    id: 4,
    name: "David",
    avatar: "https://picsum.photos/seed/request1/100/100",
  },
];

export default function FriendsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-headline">Friends</h1>

        <Card>
          <CardHeader>
            <CardTitle>Add Friend</CardTitle>
            <CardDescription>
              Enter a username to send a friend request.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="Username#1234" />
            <Button>
              <UserPlus className="mr-2" />
              Send Request
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Friend Requests ({requests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="friends">
            <Card>
              <CardContent className="p-6 space-y-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>
                          {friend.name.charAt(0)}
                        </AvatarFallback>
                        {friend.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold">{friend.name}</p>
                        <p
                          className={`text-sm ${
                            friend.online
                              ? "text-success"
                              : "text-muted-foreground"
                          }`}
                        >
                          {friend.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <MessageSquarePlus className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <UserX className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests">
            <Card>
              <CardContent className="p-6 space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.avatar} alt={request.name} />
                        <AvatarFallback>
                          {request.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{request.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button>Accept</Button>
                      <Button variant="outline">Decline</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
