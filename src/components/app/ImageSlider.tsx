
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type { ImagePlaceholder } from '@/lib/types';

// A helper function to format the banner ID into a URL path
const formatUrl = (id: string) => {
    // Example: 'ludo-banner' -> '/lobby'
    // Example: 'community-banner' -> '/community'
    if (id.includes('ludo-banner')) return '/lobby';
    return `/${id.replace(/-banner/g, '')}`;
}

export const ImageSlider = ({ images }: { images: ImagePlaceholder[] }) => {
  const autoplayOptions = {
    delay: 4000,
    stopOnInteraction: false,
  };
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay(autoplayOptions)]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg" ref={emblaRef}>
        <div className="flex h-full">
            {images.map((image, index) => (
                <div className="relative flex-[0_0_100%] h-full" key={image.id}>
                    <Link href={formatUrl(image.id)} className="block h-full w-full">
                        <Image 
                            src={image.imageUrl} 
                            alt={image.description || `Banner image ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0} // Prioritize loading the first image
                        />
                        {/* The overlay text has been removed as requested */}
                    </Link>
                </div>
            ))}
        </div>
    </div>
  );
};
