
'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Megaphone } from 'lucide-react';
import type { News } from '@/lib/types';

export default function NewsTicker() {
  const firestore = useFirestore();
  const [newsItems, setNewsItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
      setNewsItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  if (loading || newsItems.length === 0) {
    return null; // Don't render anything if loading or no news
  }

  return (
    <div className="relative flex overflow-hidden bg-primary/10 text-primary-foreground py-3 rounded-lg border border-primary/20 items-center">
        <div className="absolute left-0 pl-4 pr-4 z-10">
             <Megaphone className="h-5 w-5 text-primary" />
        </div>
      <div className="animate-marquee whitespace-nowrap pl-16">
        {newsItems.map(item => (
          <span key={item.id} className="mx-4 text-sm font-medium text-foreground">
            <span className="font-bold text-primary">{item.title}:</span> {item.content}
          </span>
        ))}
         {newsItems.map(item => (
          <span key={`${item.id}-clone`} className="mx-4 text-sm font-medium text-foreground">
            <span className="font-bold text-primary">{item.title}:</span> {item.content}
          </span>
        ))}
      </div>
    </div>
  );
}
