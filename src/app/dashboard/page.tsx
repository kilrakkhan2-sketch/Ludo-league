
import { Suspense } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getAnnouncements } from '@/firebase/admin-helpers';
import type { Announcement } from '@/types';
import DashboardClientContent from './DashboardClientContent';

const NewsCarousel = async () => {
    const announcements = await getAnnouncements();

    if (announcements.length === 0) {
        return null;
    }

    const getBadgeVariant = (type: Announcement['type']) => {
        switch (type) {
            case 'Promo': return 'default';
            case 'Update': return 'secondary';
            case 'Warning': return 'destructive';
            default: return 'outline';
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
                            <Card className="bg-card">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{ann.title}</CardTitle>
                                        <Badge variant={getBadgeVariant(ann.type)}>{ann.type}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{ann.content}</p>
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
                <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-32 w-full" /></div>}>
                    <NewsCarousel />
                </Suspense>
            </div>
        </AppShell>
    );
}
