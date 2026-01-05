
'use client';
import { motion } from 'framer-motion';

const colors = ["#3B82F6", "#10B981", "#F97316", "#EF4444"];

const containerVariants = {
  start: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const dotVariants = {
  start: {
    y: "0%",
  },
  end: {
    y: "100%",
  },
};

const dotTransition = {
  duration: 0.4,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "reverse" as const,
};

export const CustomLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
       <div className="flex items-end justify-center gap-2 h-12">
            <motion.span
                className="block w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[0] }}
                variants={dotVariants}
                transition={{...dotTransition, delay: 0}}
            />
            <motion.span
                className="block w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[1] }}
                variants={dotVariants}
                transition={{...dotTransition, delay: 0.2}}
            />
            <motion.span
                className="block w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[2] }}
                 variants={dotVariants}
                transition={{...dotTransition, delay: 0.4}}
            />
             <motion.span
                className="block w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[3] }}
                 variants={dotVariants}
                transition={{...dotTransition, delay: 0.6}}
            />
      </div>
    </div>
  );
};

export default CustomLoader;
