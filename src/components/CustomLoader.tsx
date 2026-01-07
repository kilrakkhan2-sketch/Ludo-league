
'use client';
import { motion } from 'framer-motion';
import { NewsTicker } from './app/news-ticker';
import { Swords } from 'lucide-react';

const diceVariants = {
  initial: { rotate: 0, scale: 0.8 },
  animate: { 
    rotate: 360, 
    scale: [1, 1.1, 1],
    transition: { duration: 2, ease: "linear", repeat: Infinity } 
  },
};

const dotVariants = {
  animate: (i: number) => ({
    scale: [1, 1.3, 1],
    opacity: [0.7, 1, 0.7],
    transition: { 
      delay: i * 0.2,
      duration: 1, 
      repeat: Infinity,
      ease: "easeInOut"
    }
  })
}

export const CustomLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-background">
      {/* Noise background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 800\"><g fill-opacity=\"0.05\"><circle fill=\"hsl(var(--primary))\" cx=\"400\" cy=\"400\" r=\"600\"/><circle fill=\"hsl(var(--secondary))\" cx=\"400\" cy=\"400\" r=\"500\"/><circle fill=\"hsl(var(--muted))\" cx=\"400\" cy=\"400\" r=\"300\"/><circle fill=\"hsl(var(--accent))\" cx=\"400\" cy=\"400\" r=\"200\"/><circle fill=\"hsl(var(--border))\" cx=\"400\" cy=\"400\" r=\"100\"/></g></svg>')] opacity-20"></div>
      
      <div className="relative flex flex-col items-center justify-center gap-8 text-center p-4">
        <motion.div 
            className="relative h-20 w-20 flex items-center justify-center"
            variants={diceVariants}
            initial="initial"
            animate="animate"
        >
            <div className="absolute grid grid-cols-3 grid-rows-3 gap-1.5 h-16 w-16">
                {[...Array(9)].map((_, i) => (
                    <motion.div 
                        key={i}
                        custom={i}
                        variants={dotVariants}
                        className="h-full w-full bg-primary rounded-full"
                    />
                ))}
            </div>
            <Swords className="absolute h-10 w-10 text-primary-foreground" />
        </motion.div>

        <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Loading your Ludo world...</h2>
            <p className="text-sm text-muted-foreground">Getting things ready. Won't be long!</p>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-4">
        <NewsTicker />
      </div>
    </div>
  );
};

export default CustomLoader;
