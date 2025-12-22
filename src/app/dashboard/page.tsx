
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
      return null; // Don't show skeleton, just hide section while loading
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
             <h2 className="text-lg font-bold mb-3 px-4 sm:px-6">News & Updates</h2>
             <Carousel
                opts={{
                    align: "start",
                    loop: announcements.length > 1,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {announcements.map((ann) => (
                        <CarouselItem key={ann.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Card className={cn("border-0 shadow-lg", getCardClasses(ann.type))}>
                                    <CardContent className="p-6">
                                        <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0">{ann.type}</Badge>
                                        <h3 className="font-bold text-lg mb-2">{ann.title}</h3>
                                        <p className="text-sm text-white/90">{ann.content}</p>
                                    </CardContent>
                                </Card>
                            </div>
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
        <>
             <DashboardClientContent />
             <div className="pb-20">
                <NewsCarousel />
            </div>
        </>
    );
}

    