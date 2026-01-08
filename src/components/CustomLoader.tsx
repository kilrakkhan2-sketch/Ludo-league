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
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_800_800%27%3e%3cg_fill-opacity=%270.05%27%3e%3ccircle_fill=%27hsl(var(--primary))%27_cx=%27400%27_cy=%27400%27_r=%27600%27/%3e%3ccircle_fill=%27hsl(var(--secondary))%27_cx=%27400%27_cy=%27400%27_r=%27500%27/%3e%3ccircle_fill=%27hsl(var(--muted))%27_cx=%27400%27_cy=%27400%27_r=%27300%27/%3e%3ccircle_fill=%27hsl(var(--accent))%27_cx=%27400%27_cy=%27400%27_r=%27200%27/%3e%3ccircle_fill=%27hsl(var(--border))%27_cx=%27400%27_cy=%27400%27_r=%27100%27/%3e%3c/g%3e%3c/svg%3e')] opacity-20"></div>
      
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
