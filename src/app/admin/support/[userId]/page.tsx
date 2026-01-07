
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAdmin } from '@/firebase/use-admin'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Send, ArrowLeft, UserCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  createdAt: Date;
}

interface SupportChatPageProps {
  params: {
    userId: string;
  };
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export default function SupportChatPage({ params }: SupportChatPageProps) {
  const { admin } = useAdmin(); // Assuming you have a hook for admin auth
  const { userId } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data() as UserProfile);
      } else {
        console.error("User not found");
      }
    };

    fetchUserData();

    const messagesQuery = query(
      collection(db, `supportChats/${userId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          sender: data.sender,
          createdAt: data.createdAt.toDate(),
        } as Message;
      });
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !admin) return;

    setIsSending(true);
    const messagesColRef = collection(db, `supportChats/${userId}/messages`);

    try {
      await addDoc(messagesColRef, {
        text: newMessage,
        sender: 'admin',
        createdAt: serverTimestamp(),
        read: false,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* User Info Column */}
      <Card className="md:col-span-1 h-fit">
        <CardHeader className='flex flex-row items-center gap-4'>
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.photoURL || undefined} />
              <AvatarFallback>{userProfile ? getInitials(userProfile.displayName) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle>{userProfile?.displayName}</CardTitle>
                <CardDescription>{userProfile?.email}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className='space-y-4'>
            <div className="flex justify-between items-center">
                <span className='text-sm font-medium text-muted-foreground'>KYC Status</span>
                 <Badge
                    variant={userProfile?.kycStatus === 'approved' ? 'default' : 'destructive'}
                    className={cn({
                        'bg-green-100 text-green-800': userProfile?.kycStatus === 'approved',
                        'bg-red-100 text-red-800': userProfile?.kycStatus === 'rejected',
                        'bg-yellow-100 text-yellow-800': userProfile?.kycStatus === 'pending',
                    })}
                >
                    {userProfile?.kycStatus?.toUpperCase() || 'N/A'}
                </Badge>
            </div>
             <div className="flex justify-between items-center">
                <span className='text-sm font-medium text-muted-foreground'>Wallet Balance</span>
                <span className='font-bold'>₹{userProfile?.walletBalance?.toFixed(2) || '0.00'}</span>
            </div>
            <Button asChild className='w-full'>
                <Link href={`/admin/users/${userId}`}>
                    <UserCircle className="mr-2 h-4 w-4"/> View Full Profile
                </Link>
            </Button>
        </CardContent>
      </Card>

      {/* Chat Column */}
      <Card className="md:col-span-2 flex flex-col h-full">
        <CardHeader className='flex-shrink-0'>
            <div className='flex items-center gap-4'>
                <Button asChild variant='outline' size='icon'>
                     <Link href="/admin/support"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <CardTitle>Chat with {userProfile?.displayName}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={cn('flex items-end gap-2',
                    msg.sender === 'admin' ? 'justify-end' : 'justify-start')}
              >
                {msg.sender === 'user' && (
                    <Avatar className='h-8 w-8'>
                         <AvatarImage src={userProfile?.photoURL || undefined} />
                         <AvatarFallback>{userProfile ? getInitials(userProfile.displayName) : 'U'}</AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-sm',
                    msg.sender === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs mt-1 text-right opacity-70">{msg.createdAt.toLocaleTimeString()}</p>
                </div>
                 {msg.sender === 'admin' && (
                    <Avatar className='h-8 w-8'>
                        <AvatarFallback><ShieldCheck className='h-5 w-5'/></AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              autoComplete="off"
            />
            <Button type="submit" disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
