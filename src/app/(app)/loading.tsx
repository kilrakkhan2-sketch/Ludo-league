'use client';
import { Trophy } from 'lucide-react';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-24 w-24">
            {/* Base icon with a pulse animation */}
            <Trophy className="h-full w-full text-primary animate-pulse" />
            {/* A second icon with a ping animation for a more dynamic feel */}
            <Trophy className="absolute inset-0 h-full w-full text-primary animate-ping opacity-60" />
        </div>
        <p className="text-lg font-semibold text-primary animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
