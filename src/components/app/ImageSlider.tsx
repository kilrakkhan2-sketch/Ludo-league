
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    };
  }
};

// Adjust swipe confidence threshold
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const ImageSlider = ({ images }: { images: string[] }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  // Wrap the index
  const imageIndex = page % images.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      paginate(1);
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [page]);

  return (
    <div className="relative w-full h-40 md:h-56 rounded-lg overflow-hidden shadow-lg">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          className="absolute w-full h-full"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
        >
           <Image 
              src={images[imageIndex]} 
              alt={`Banner image ${imageIndex + 1}`}
              fill
              className="object-cover inline-block"
              priority={imageIndex === 0} // Prioritize loading the first image
            />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${imageIndex === i ? 'bg-white' : 'bg-white/50'}`}
            onClick={() => setPage([i, i > imageIndex ? 1 : -1])}
          />
        ))}
      </div>
    </div>
  );
};
