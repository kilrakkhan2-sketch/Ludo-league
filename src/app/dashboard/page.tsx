
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import type { Announcement } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardClientContent from './DashboardClientContent';
import { cn } from "@/lib/utils";

const NewsCarousel = () => {
    const { data: announcements, loading } = useCollection<Announcement>('announcements', {
      orderBy: ['createdAt', 'desc'],
      limit: 5,
    });

    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      );
    }

    if (announcements.length === 0) {
        return null;
    }

    const getCardClasses = (type: Announcement['type']) => {
        switch (type) {
            case 'Promo': return 'bg-gradient-to-br from-blue-500 to-blue-700 text-white';
            case 'Update': return 'bg-gradient-to-br from-slate-600 to-slate-800 text-white';
            case 'Warning': return 'bg-gradient-to-br from-red-500 to-red-700 text-white';
            default: return 'bg-gradient-to-br from-violet-500 to-violet-700 text-white';
        }
    };

    return (
        <section>
             <h2 className="text-lg font-bold mb-3">News & Updates</h2>
             <Carousel
                opts={{
                    align: "start",
                    loop: announcements.length > 1,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {announcements.map((ann) => (
                        <CarouselItem key={ann.id}>
                            <Card className={cn("border-0 shadow-lg", getCardClasses(ann.type))}>
                                <CardContent className="p-6">
                                     <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0">{ann.type}</Badge>
                                    <h3 className="font-bold text-lg mb-2">{ann.title}</h3>
                                    <p className="text-sm text-white/90">{ann.content}</p>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {announcements.length > 1 && (
                    <>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </>
                )}
            </Carousel>
        </section>
    );
};


export default function DashboardPage() {
    return (
        <AppShell pageTitle="Dashboard">
             <DashboardClientContent />
             <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-20">
                <NewsCarousel />
            </div>
        </AppShell>
    );
}
