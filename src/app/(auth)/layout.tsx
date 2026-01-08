'use client';
import Image from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const bgImage = PlaceHolderImages.find(img => img.id === 'ludo-background');

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4">
            {/* Background Image */}
            {bgImage && (
                <Image 
                    src={bgImage.imageUrl}
                    alt="Ludo background"
                    fill
                    className="object-cover object-center z-[-1]"
                />
            )}
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60 z-[-1]" />

            {/* Centered Content */}
            <main className="w-full max-w-md">
                {children}
            </main>
        </div>
    );
}
