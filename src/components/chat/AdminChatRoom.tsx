
'use client';

import { useRef, useState, useEffect } from 'react';
import { useCollection, useUser } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminChatMessage } from '@/types'; // Using a specific type for clarity
import { format }s from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Shield } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AdminChatRoomProps {
  contextPath: string; // e.g., `matches/MATCH_ID`
}

export function AdminChatRoom({ contextPath }: AdminChatRoomProps) {
  const { userData, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Unified message path for both admins and users
  const messagesPath = `${contextPath}/messages`;
  const { data: messages, loading: messagesLoading } = useCollection<AdminChatMessage>(messagesPath, { orderBy: ['createdAt', 'asc'] });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !firestore || newMessage.trim() === '') return;

    try {
      await addDoc(collection(firestore, messagesPath), {
        userId: userData.uid,
        userName: userData.displayName,
        text: newMessage,
        createdAt: serverTimestamp(),
        // Add admin-specific fields
        isAdmin: true,
        role: 'admin',
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending admin message:", error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isLoading = messagesLoading || userLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Internal & User Chat
        </CardTitle>
      </CardHeader>
      <CardContent ref={scrollRef} className="h-72 overflow-y-auto pr-4 space-y-4">
        {isLoading ? (
            <div className='space-y-4'>
                <Skeleton className='h-12 w-3/4' />
                <Skeleton className='h-12 w-3/4 ml-auto' />
            </div>
        ) : messages && messages.length > 0 ? (
          messages.map(msg => {
            const isYou = msg.userId === userData?.uid;
            const isAdminMsg = msg.role === 'admin';
            return (
              <div key={msg.id} className={`flex gap-3 ${isYou ? 'justify-end' : 'justify-start'}`}>
                 <div className={`rounded-lg px-3 py-2 max-w-sm ${isYou ? 'bg-primary text-primary-foreground' : (isAdminMsg ? 'bg-secondary' : 'bg-muted')}`}>
                    <p className={`text-sm font-bold flex items-center gap-1.5 ${isAdminMsg ? 'text-primary' : ''}`}>
                        {isAdminMsg && <Shield size={14} />} {isYou ? 'You' : msg.userName}
                    </p>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : ''}
                    </p>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-center text-muted-foreground pt-10">No messages yet. Start the conversation.</p>
        )}
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to users or admins..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || newMessage.trim() === ''}>
            <Send className='h-4 w-4' />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
