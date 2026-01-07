"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, orderBy, query, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminOnly } from '@/hooks/useAdminOnly';


interface ChatThread {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  userAvatar: string;
}

function getInitials(name: string) {
    if(!name) return "U";
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase();
}

export default function SupportInboxPage() {
  const firestore = useFirestore();
  useAdminOnly();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if(!firestore) return;
    
    const fetchThreads = async () => {
      setLoading(true);
      setError(null);
      try {
        const chatsCollectionRef = collection(firestore, 'supportChats');
        const chatDocsSnapshot = await getDocs(chatsCollectionRef);

        if (chatDocsSnapshot.empty) {
          setThreads([]);
          setLoading(false);
          return;
        }

        const threadPromises = chatDocsSnapshot.docs.map(async (chatDoc) => {
          const userId = chatDoc.id;
          
          const userDocRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userDocRef);

          const messagesQuery = query(collection(firestore, `supportChats/${userId}/messages`), orderBy('createdAt', 'desc'), limit(1));
          const lastMessageSnapshot = await getDocs(messagesQuery);
          const lastMessage = lastMessageSnapshot.docs.length > 0 ? lastMessageSnapshot.docs[0].data() : null;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              userId,
              userName: userData.displayName || 'N/A',
              userEmail: userData.email || 'N/A',
              userAvatar: userData.photoURL || '',
              lastMessage: lastMessage?.text || 'No messages yet.',
              lastMessageAt: lastMessage?.createdAt?.toDate(),
            };
          } else {
             return null;
          }
        });

        const resolvedThreads = (await Promise.all(threadPromises)).filter(Boolean) as ChatThread[];
        
        resolvedThreads.sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0));

        setThreads(resolvedThreads);
      } catch (err) {
        console.error('Error fetching support threads:', err);
        setError('Failed to load support threads. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [firestore]);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                Support Inbox
            </h2>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>All active support conversations with users.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <p>{error}</p>
            </div>
          ) : threads.length === 0 ? (
             <div className="text-center py-20">
                <h3 className="text-xl font-semibold">No Conversations</h3>
                <p className="text-muted-foreground mt-2">When a user starts a new chat, it will appear here.</p>
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {threads.map((thread) => (
                  <TableRow key={thread.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={thread.userAvatar} alt={thread.userName} />
                          <AvatarFallback>{getInitials(thread.userName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{thread.userName}</p>
                          <p className="text-sm text-muted-foreground">{thread.userEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <p className='truncate max-w-sm'>{thread.lastMessage}</p>
                        <p className='text-xs text-muted-foreground'>
                            {thread.lastMessageAt ? thread.lastMessageAt.toLocaleString() : ''}
                        </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/support/${thread.userId}`} className={cn(buttonVariants({ variant: 'outline' }))}>
                        Open Chat <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
