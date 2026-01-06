
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { News } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

export function NewsTicker() {
  const firestore = useFirestore();
  const [newsItems, setNewsItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const newsRef = collection(firestore, 'news');
    const q = query(newsRef, orderBy('createdAt', 'desc'), limit(10));
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
    <Card className="bg-primary/10 border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{ loop: true, align: 'start' }}
          orientation="vertical"
        >
          <CarouselContent className="h-14">
            {newsItems.map((item) => (
              <CarouselItem key={item.id}>
                <Link href="/news" className="flex items-center pl-4 pr-6 h-full w-full group">
                    <div className="flex items-center gap-4 w-full">
                        <Megaphone className="h-6 w-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-grow overflow-hidden">
                            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                        </div>
                    </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  );
}
