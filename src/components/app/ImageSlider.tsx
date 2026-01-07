
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export const ImageSlider = ({ images }: { images: string[] }) => {
  const autoplayOptions = {
    delay: 4000,
    stopOnInteraction: false,
  };
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay(autoplayOptions)]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg" ref={emblaRef}>
        <div className="flex h-full">
            {images.map((src, index) => (
                <div className="relative flex-[0_0_100%] h-full" key={index}>
                    <Image 
                        src={src} 
                        alt={`Banner image ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}
        </div>
    </div>
  );
};
