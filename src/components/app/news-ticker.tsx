'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Megaphone } from 'lucide-react';
import type { News } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export function NewsTicker() {
  const firestore = useFirestore();
  const [newsItems, setNewsItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const newsRef = collection(firestore, 'news');
    const q = query(newsRef, orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
      setNewsItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  if (loading || newsItems.length === 0) {
    return null; // Don't render anything if there's no news or it's loading
  }

  return (
    <Link href="/news">
      <Card className="relative flex overflow-hidden bg-primary/10 text-primary-foreground py-3 rounded-lg border border-primary/20 items-center group cursor-pointer">
          <div className="absolute left-0 pl-4 pr-4 z-10 bg-gradient-to-r from-background via-background/80 to-transparent h-full flex items-center">
               <Megaphone className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </div>
        <div className="animate-marquee whitespace-nowrap pl-16 flex">
          {[...newsItems, ...newsItems].map((item, index) => (
            <span key={`${item.id}-${index}`} className="mx-6 text-sm font-medium text-foreground flex-shrink-0">
              <span className="font-bold text-primary">{item.title}:</span> {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}
