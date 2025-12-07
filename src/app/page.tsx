
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function SplashPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.push('/login');
    }, 3000); // 3-second splash screen

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen font-sans items-center justify-center bg-background p-4 text-center">
        <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-2xl shadow-lg">
            <Image src="/logo.svg" alt="LudoLeague Logo" width={96} height={96} className="text-primary-foreground" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-headline mt-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            LudoLeague
        </h1>
        <div className="absolute bottom-12 flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
        </div>
    </div>
  );
}
