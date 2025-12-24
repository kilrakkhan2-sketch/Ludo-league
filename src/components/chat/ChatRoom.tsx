
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Message, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Shield } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface ChatRoomProps {
  matchId: string;
}

// A small component to fetch and display a user's avatar and name efficiently.
const PlayerInfo = ({ userId, isYou, isAdmin }: { userId: string, isYou: boolean, isAdmin: boolean }) => {
    const { data: user, loading } = useDoc<UserProfile>(`users/${userId}`);

    if (loading) return <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-20" /></div>;
    if (isYou) return <p className="text-sm font-bold">You</p>;

    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <p className={`text-sm font-bold flex items-center gap-1.5 ${isAdmin ? 'text-primary' : ''}`}>
                    {isAdmin && <Shield size={14} />} {user?.displayName || 'Player'}
                </p>
                {isAdmin && <p className="text-xs text-primary">Admin</p>}
            </div>
        </div>
    );
}

export function ChatRoom({ matchId }: ChatRoomProps) {
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesPath = `matches/${matchId}/messages`;
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesPath, { orderBy: ['createdAt', 'asc'] });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || newMessage.trim() === '') return;

    await addDoc(collection(firestore, messagesPath), {
        userId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp(),
        role: 'user', // Explicitly set role for user messages
    });
    setNewMessage('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const loading = messagesLoading || userLoading;

  return (
    <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-bold text-lg">Match Chat</h3>
      <div ref={scrollRef} className="h-72 overflow-y-auto space-y-4 pr-2">
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" /><Skeleton className="h-12 w-3/4 ml-auto" />
            </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: Message) => {
              const isYou = msg.userId === user?.uid;
              const isAdmin = msg.role === 'admin';
              return (
                <div key={msg.id} className={`flex gap-3 text-sm ${isYou ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-sm ${isYou ? 'bg-primary text-primary-foreground' : (isAdmin ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-muted')}`}>
                        <PlayerInfo userId={msg.userId} isYou={isYou} isAdmin={isAdmin} />
                        <p className="mt-1">{msg.text}</p>
                         <p className="text-xs opacity-70 mt-1.5 text-right">
                            {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : ''}
                        </p>
                    </div>
                </div>
              )
        })
        ) : (
          <p className="text-center text-muted-foreground pt-16">No messages yet. Say hello!</p>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={loading} />
        <Button type="submit" size="icon" disabled={loading || newMessage.trim() === ''}><Send className='h-4 w-4' /></Button>
      </form>
    </div>
  );
}
