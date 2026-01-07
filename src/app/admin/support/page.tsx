
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAdminOnly } from '@/hooks/useAdminOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { type DocumentData } from 'firebase/firestore';

interface ChatThread {
  userId: string;
  lastMessage: string;
  lastMessageTimestamp: Date | null;
  userName: string;
  userAvatar: string;
}

// A new component to fetch and display the last message for a thread
const LastMessage = ({ firestore, userId }: { firestore: any; userId: string }) => {
  const [lastMsg, setLastMsg] = useState<{text: string, timestamp: string}>({ text: 'No messages yet...', timestamp: '' });

  useEffect(() => {
    if (!firestore || !userId) return;

    const messagesRef = collection(firestore, `supportChats/${userId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[0].data();
        const text = lastDoc.text || '';
        // Truncate message if too long
        const snippet = text.length > 50 ? `${text.substring(0, 50)}...` : text;
        const time = lastDoc.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
        setLastMsg({ text: snippet, timestamp: time });
      } else {
        setLastMsg({ text: 'No messages yet...', timestamp: '' });
      }
    });

    return () => unsubscribe();
  }, [firestore, userId]);

  return (
    <div className='flex justify-between items-center w-full'>
        <p className="text-sm text-muted-foreground truncate">
            {lastMsg.text}
        </p>
        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{lastMsg.timestamp}</span>
    </div>
  )
};


export default function AdminSupportPage() {
  useAdminOnly();
  const firestore = useFirestore();
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (!firestore) return;

      setLoading(true);
      try {
        const supportChatsRef = collection(firestore, 'supportChats');
        const chatDocs = await getDocs(supportChatsRef);
        const threads: ChatThread[] = [];

        for (const chatDoc of chatDocs.docs) {
            // The doc id is the user's UID
            const userId = chatDoc.id;
            // We need to fetch user details separately
            const userRef = doc(firestore, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if(userSnap.exists()){
                const userData = userSnap.data();
                threads.push({
                    userId: userId,
                    userName: userData.displayName || 'Unknown User',
                    userAvatar: userData.photoURL || '',
                    // Placeholder values, will be updated by LastMessage component
                    lastMessage: '', 
                    lastMessageTimestamp: null
                });
            }
        }

        setChatThreads(threads);
      } catch (error) {
        console.error('Error fetching support chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Support Inbox</h1>
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <MessageSquare className='h-6 w-6'/>
                    Active Conversations
                </CardTitle>
            </CardHeader>
            <CardContent>
                {chatThreads.length === 0 ? (
                <p className="text-muted-foreground">No active support chats found.</p>
                ) : (
                <div className="space-y-2">
                    {chatThreads.map((thread) => (
                    <Link href={`/admin/support/${thread.userId}`} key={thread.userId}>
                        <div className="flex items-center p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <Avatar className="h-12 w-12 mr-4 border">
                                <AvatarImage src={thread.userAvatar} />
                                <AvatarFallback>{thread.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-semibold">{thread.userName}</p>
                                 <LastMessage firestore={firestore} userId={thread.userId} />
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
                    ))}
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
