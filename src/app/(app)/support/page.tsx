'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { LifeBuoy, Send, MessageSquare, Loader2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { WhatsAppIcon, TelegramIcon } from '@/components/app/SocialIcons';
import Link from 'next/link';

type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt: Timestamp;
};

const ChatMessage = ({ message, isCurrentUser }: { message: Message; isCurrentUser: boolean }) => {
  return (
    <div className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>{message.senderName?.charAt(0) || 'A'}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xs md:max-w-md rounded-lg px-3 py-2',
          isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted rounded-bl-none'
        )}
      >
        <p className="text-sm">{message.text}</p>
        <p className="text-xs text-right mt-1 opacity-70">
          {message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!firestore || !user) return;

    setLoading(true);
    const messagesRef = collection(firestore, `supportChats/${user.uid}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching chat messages: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newMessage.trim()) return;

    const messagesRef = collection(firestore, `supportChats/${user.uid}/messages`);
    await addDoc(messagesRef, {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName,
      senderAvatar: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LifeBuoy className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Have a question or facing an issue? Our team is here to help you.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Chat with Support
            </CardTitle>
            <CardDescription>Get real-time assistance from our support team.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-[60vh]">
            <div className="flex-grow space-y-4 overflow-y-auto p-4 bg-background rounded-lg border">
                {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                {!loading && messages.length === 0 && <div className="flex justify-center items-center h-full text-muted-foreground">No messages yet. Start the conversation!</div>}
                {!loading && messages.map(msg => <ChatMessage key={msg.id} message={msg} isCurrentUser={msg.senderId === user?.uid} />)}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Other Contact Methods</CardTitle>
                    <CardDescription>Reach out to us on your favorite platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Link href="https://wa.me/910000000000" target="_blank" rel="noopener noreferrer">
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <WhatsAppIcon className="h-10 w-10"/>
                                <div>
                                    <p className="font-semibold">WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">Chat with us live</p>
                                </div>
                            </div>
                        </Card>
                     </Link>
                     <Link href="https://t.me/ludoleague_support" target="_blank" rel="noopener noreferrer">
                        <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                             <div className="flex items-center gap-4">
                                <TelegramIcon className="h-10 w-10"/>
                                <div>
                                    <p className="font-semibold">Telegram</p>
                                    <p className="text-sm text-muted-foreground">Join our channel</p>
                                </div>
                            </div>
                        </Card>
                     </Link>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
