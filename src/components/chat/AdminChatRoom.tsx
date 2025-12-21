
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useCollection, useUser } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminChatMessage, UserProfile } from '@/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';

interface AdminChatRoomProps {
  contextPath: string; // e.g., "deposit-requests/xyz123"
}

export function AdminChatRoom({ contextPath }: AdminChatRoomProps) {
  const { userData, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesPath = `${contextPath}/admin-chat`;
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
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending admin message:", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const loading = messagesLoading || userLoading;

  return (
    <Card className="flex flex-col h-full">
        <CardHeader>
             <CardTitle>Admin Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto space-y-4 pr-2" ref={scrollRef}>
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-12 w-3/4 ml-auto" />
                    <Skeleton className="h-12 w-3/4" />
                </div>
            ) : messages.length > 0 ? (
            messages.map((msg: AdminChatMessage) => {
              const isYou = msg.userId === userData?.uid;
              return (
                <div key={msg.id} className={`flex gap-2 items-end ${isYou ? 'justify-end' : ''}`}>
                    {!isYou && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{msg.userName?.[0]}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg px-3 py-2 max-w-xs ${isYou ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm font-bold">{isYou ? 'You' : msg.userName}</p>
                        <p className="text-sm">{msg.text}</p>
                         <p className="text-xs opacity-70 mt-1 text-right">
                            {msg.createdAt && msg.createdAt.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : ''}
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
            placeholder="Type your message..."
            />
            <Button type="submit" size="icon"><Send className='h-4 w-4' /></Button>
        </form>
      </CardFooter>
    </Card>
  );
}
