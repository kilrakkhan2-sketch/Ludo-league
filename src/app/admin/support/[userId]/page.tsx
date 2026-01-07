
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { useAdminOnly } from '@/hooks/useAdminOnly';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt: Timestamp;
};

const ChatMessage = ({ message, isAdminMessage, targetUser }: { message: Message; isAdminMessage: boolean, targetUser: any }) => {
    const isSupportTeamMessage = message.senderName === 'Support Team';

    const senderAvatar = isSupportTeamMessage ? '/icon-192x192.png' : targetUser?.photoURL;
    const senderName = isSupportTeamMessage ? 'Support Team' : targetUser?.displayName;

    return (
        <div className={cn('flex items-end gap-2.5', isSupportTeamMessage ? 'justify-end' : 'justify-start')}>
          {!isSupportTeamMessage && (
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarImage src={senderAvatar} />
              <AvatarFallback>{senderName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              'group max-w-sm md:max-w-md lg:max-w-lg shadow-md',
              isSupportTeamMessage
                ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-50 rounded-t-2xl rounded-l-2xl'
                : 'bg-white dark:bg-slate-800 text-foreground rounded-t-2xl rounded-r-2xl'
            )}
          >
            <div className="px-4 py-3">
                <p className="text-sm font-medium">{message.text}</p>
            </div>
           
          </div>
           {isSupportTeamMessage && (
                 <div className="flex flex-col items-end text-xs text-muted-foreground">
                    <span>{message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
             {!isSupportTeamMessage && (
                 <div className="flex flex-col items-start text-xs text-muted-foreground">
                    <span>{message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
        </div>
      );
};

export default function AdminSupportChatPage() {
  useAdminOnly();
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const targetUserId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!firestore || !targetUserId) return;

    const fetchUserData = async () => {
      const userRef = doc(firestore, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setTargetUser({ uid: userSnap.id, ...userSnap.data() });
      } else {
        console.error('Target user not found');
      }
    };
    
    fetchUserData();

    setLoading(true);
    const messagesRef = collection(firestore, `supportChats/${targetUserId}/messages`);
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
  }, [firestore, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newMessage.trim() || !targetUserId) return;

    const messagesRef = collection(firestore, `supportChats/${targetUserId}/messages`);
    await addDoc(messagesRef, {
      text: newMessage,
      senderId: user.uid, // The admin's UID
      senderName: 'Support Team',
      senderAvatar: '/icon-192x192.png', // Admin avatar
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  return (
    <div className="space-y-4">
        <Button asChild variant="ghost" className="-ml-4">
            <Link href="/admin/support">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inbox
            </Link>
      </Button>

       <Card className="shadow-lg dark:shadow-slate-900">
        <CardHeader className="border-b dark:border-slate-700">
          <div className='flex items-center gap-4'>
             <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={targetUser?.photoURL} />
                <AvatarFallback>{targetUser?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
                 <CardTitle className='text-xl'>Conversation with {targetUser?.displayName || 'User'}</CardTitle>
                 <CardDescription>User ID: {targetUserId}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[65vh]">
          <div className="flex-grow space-y-6 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50">
              {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
              {!loading && messages.length === 0 && <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground"><MessageSquare className="h-12 w-12 mb-4"/><p className='font-medium'>This user has not sent any messages yet.</p></div>}
              {!loading && messages.map(msg => <ChatMessage key={msg.id} message={msg} isAdminMessage={true} targetUser={targetUser} />)}
              <div ref={messagesEndRef} />
          </div>
           <div className="p-4 border-t dark:border-slate-700 bg-background">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply as Support Team..."
                    autoComplete="off"
                    className="h-12 text-base rounded-full focus-visible:ring-primary/50 dark:bg-slate-800"
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-full flex-shrink-0 bg-slate-800 hover:bg-slate-900 text-white" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                </Button>
                </form>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
