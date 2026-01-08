
'use client';

import { Card, CardProps } from './card';
import { motion } from 'framer-motion';

export function AnimatedCard(props: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card {...props} />
    </motion.div>
  );
}
