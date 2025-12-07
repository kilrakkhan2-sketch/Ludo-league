
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
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=alice",
    online: true,
  },
  {
    id: 2,
    name: "Bob",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=bob",
    online: false,
  },
  {
    id: 3,
    name: "Charlie",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=charlie",
    online: true,
  },
];

const requests = [
  {
    id: 4,
    name: "David",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=david",
  },
];

export default function FriendsPage() {
  return (
    <AppShell pageTitle="Friends" showBackButton>
      <div className="p-4 space-y-6">
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
              <UserPlus className="mr-2 h-4 w-4" />
              Send Request
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="friends">
            <div className="space-y-4 pt-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border"
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
              </div>
          </TabsContent>
          <TabsContent value="requests">
             <div className="space-y-4 pt-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border"
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
                      <Button size="sm">Accept</Button>
                      <Button size="sm" variant="outline">Decline</Button>
                    </div>
                  </div>
                ))}
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
