
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
import { MessageSquarePlus, UserPlus, UserX, Check, X } from "lucide-react";
import { useUser, useCollection, useDoc, useFirebase } from "@/firebase";
import type { UserProfile, FriendRequest } from "@/types";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, addDoc, writeBatch, doc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function FriendsPage() {
  const { user } = useUser();
  const { data: currentUserProfile } = useDoc<UserProfile>(user ? `users/${user.uid}` : "");
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [usernameQuery, setUsernameQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My friends
  const friendIds = useMemo(() => currentUserProfile?.friends || [], [currentUserProfile]);
  const { data: friends, loading: friendsLoading } = useCollection<UserProfile>('users', {
    where: friendIds.length > 0 ? ['uid', 'in', friendIds] : undefined
  });

  // Incoming friend requests
  const { data: requests, loading: requestsLoading } = useCollection<FriendRequest>('friend-requests', {
      where: [['to', '==', user?.uid || ''], ['status', '==', 'pending']]
  });
  
  const requestSenderIds = useMemo(() => requests.map(r => r.from), [requests]);
  const { data: requestSenders, loading: sendersLoading } = useCollection<UserProfile>('users', {
    where: requestSenderIds.length > 0 ? ['uid', 'in', requestSenderIds] : undefined
  });
  
  const requestSendersMap = useMemo(() => {
    return new Map(requestSenders.map(sender => [sender.uid, sender]));
  }, [requestSenders]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !usernameQuery) return;
    setIsSubmitting(true);
    
    try {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("username", "==", usernameQuery));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "User not found" });
        setIsSubmitting(false);
        return;
      }
      
      const targetUser = querySnapshot.docs[0].data() as UserProfile;
      
      if (targetUser.uid === user.uid) {
         toast({ variant: "destructive", title: "You can't add yourself!" });
         setIsSubmitting(false);
         return;
      }

      await addDoc(collection(firestore, "friend-requests"), {
        from: user.uid,
        to: targetUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast({ title: "Friend request sent!" });
      setUsernameQuery("");

    } catch (error) {
      toast({ variant: "destructive", title: "Error sending request" });
    }
    setIsSubmitting(false);
  };
  
  const handleRequestResponse = async (request: FriendRequest, newStatus: 'accepted' | 'declined') => {
      if (!firestore || !user) return;
      try {
        const batch = writeBatch(firestore);
        
        const requestRef = doc(firestore, 'friend-requests', request.id);
        batch.update(requestRef, { status: newStatus });
        
        if (newStatus === 'accepted') {
            const currentUserRef = doc(firestore, 'users', user.uid);
            const friendUserRef = doc(firestore, 'users', request.from);
            batch.update(currentUserRef, { friends: arrayUnion(request.from) });
            batch.update(friendUserRef, { friends: arrayUnion(user.uid) });
        }
        
        await batch.commit();
        toast({ title: newStatus === 'accepted' ? 'Friend added!' : 'Request declined' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Action failed', description: 'Could not process the request.' });
      }
  }
  
  const loading = friendsLoading || requestsLoading || sendersLoading;

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
          <CardContent>
            <form onSubmit={handleAddFriend} className="flex gap-2">
                <Input placeholder="Username" value={usernameQuery} onChange={e => setUsernameQuery(e.target.value)} />
                <Button type="submit" disabled={isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Request"}
                </Button>
            </form>
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
                {loading ? <Skeleton className="h-20 w-full" /> : friends.length === 0 ? <p className="text-center text-muted-foreground py-8">No friends yet. Add one!</p> :
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.photoURL} alt={friend.name} />
                        <AvatarFallback>
                          {friend.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{friend.name}</p>
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
                {loading ? <Skeleton className="h-20 w-full" /> : requests.length === 0 ? <p className="text-center text-muted-foreground py-8">No pending friend requests.</p> :
                requests.map((request) => {
                  const sender = requestSendersMap.get(request.from);
                  if (!sender) return null;
                  return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={sender.photoURL} alt={sender.name} />
                            <AvatarFallback>
                              {sender.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-semibold">{sender.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRequestResponse(request, 'accepted')}><Check className="h-4 w-4 mr-1"/>Accept</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRequestResponse(request, 'declined')}><X className="h-4 w-4 mr-1"/>Decline</Button>
                        </div>
                      </div>
                  )
                })}
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
