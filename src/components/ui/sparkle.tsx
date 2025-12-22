"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const SPARKLE_COLOR = 'hsl(var(--primary))';

const generateSparkle = (size: number) => {
  const sparkle = {
    id: String(Math.random()),
    createdAt: Date.now(),
    color: SPARKLE_COLOR,
    size: size,
    style: {
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      zIndex: 20,
    },
  };
  return sparkle;
};

export const Sparkle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const [sparkles, setSparkles] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSparkle = generateSparkle(Math.random() * 3 + 1);
      setSparkles(currentSparkles => [...currentSparkles, newSparkle]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSparkles([]);
    }, 2000);
    return () => clearTimeout(timeout);
  })

  return (
    <div className={cn("relative", className)}>
      {sparkles.map(sparkle => (
        <svg
          key={sparkle.id}
          width={sparkle.size}
          height={sparkle.size}
          viewBox="0 0 16 16"
          className="absolute animate-sparkle"
          style={sparkle.style}
          fill={sparkle.color}
        >
          <path d="M8 0L9.414 6.586 16 8l-6.586 1.414L8 16l-1.414-6.586L0 8l6.586-1.414L8 0z" />
        </svg>
      ))}
      {children}
    </div>
  );
};