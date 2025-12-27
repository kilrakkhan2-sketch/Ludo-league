'use client';

import { useRef } from 'react';
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner'));

export default function BannerCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  if (!bannerImages.length) {
    return null;
  }

  return (
    <section className="px-4 sm:px-6">
        <Carousel 
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
                loop: true,
            }}
        >
            <CarouselContent>
                {bannerImages.map((image) => (
                <CarouselItem key={image.id}>
                    <div className="p-1">
                        <Card className="overflow-hidden">
                            <CardContent className="flex aspect-[2.5/1] items-center justify-center p-0 relative">
                                <Image 
                                    src={image.imageUrl}
                                    alt={image.description}
                                    data-ai-hint={image.imageHint}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 640px"
                                    className="object-cover"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
    </section>
  );
}
