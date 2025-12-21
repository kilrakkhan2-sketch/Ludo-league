
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Message, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface ChatRoomProps {
  matchId: string;
}

export function ChatRoom({ matchId }: ChatRoomProps) {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);
  const { firestore } = useFirebase();
  const [newMessage, setNewMessage] = useState('');

  const messagesPath = `matches/${matchId}/messages`;
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesPath, { orderBy: ['createdAt', 'asc'] });
  
  const playerIds = useMemo(() => {
    if (!messages || messages.length === 0) return ['_'];
    return [...new Set(messages.map((m: Message) => m.userId))];
  }, [messages]);

  const { data: playerProfiles, loading: playersLoading } = useCollection<UserProfile>('users', { 
      where: ['uid', 'in', playerIds] 
  });

  const playerProfilesMap = useMemo(() => {
      const map = new Map<string, UserProfile>();
      if (playerProfiles) {
          playerProfiles.forEach(p => map.set(p.uid, p));
      }
      return map;
  }, [playerProfiles]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || newMessage.trim() === '') return;

    try {
      await addDoc(collection(firestore, messagesPath), {
        userId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  const loading = messagesLoading || userLoading || profileLoading || playersLoading;

  return (
    <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-bold text-lg">Match Chat</h3>
      <div className="h-64 overflow-y-auto space-y-4 pr-2">
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-3/4 ml-auto" />
                <Skeleton className="h-12 w-3/4" />
            </div>
        ) : messages.length > 0 ? (
          messages.map((msg: Message) => {
              const senderProfile = playerProfilesMap.get(msg.userId);
              const isYou = msg.userId === user?.uid;
              return (
                <div key={msg.id} className={`flex gap-2 ${isYou ? 'justify-end' : ''}`}>
                    {!isYou && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={senderProfile?.photoURL} />
                            <AvatarFallback>{senderProfile?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg px-3 py-2 max-w-xs ${isYou ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm font-bold">{isYou ? 'You' : senderProfile?.displayName}</p>
                        <p>{msg.text}</p>
                         <p className="text-xs opacity-70 mt-1">
                            {msg.createdAt && msg.createdAt.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : '...'}
                        </p>
                    </div>
                    {isYou && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.photoURL} />
                            <AvatarFallback>{profile?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
              )
        })
        ) : (
          <p className="text-center text-muted-foreground pt-10">No messages yet. Be the first to say something!</p>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <Button type="submit" size="icon"><Send className='h-4 w-4' /></Button>
      </form>
    </div>
  );
}
