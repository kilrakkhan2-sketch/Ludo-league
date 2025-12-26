
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
    isCentral?: boolean;
}

interface BottomNavProps {
    items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
    const pathname = usePathname();

    const hideNav = pathname ? ['/match/', '/login', '/signup', '/admin'].some(path => pathname.startsWith(path)) : false;
    if (hideNav) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-20 sm:hidden w-full max-w-lg mx-auto">
            <div className="flex justify-around items-center h-full">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                     if(item.isCentral) {
                        return (
                            <Link href={item.href} key={item.href} className="-mt-8">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg border-4 border-background transform transition-transform hover:scale-105">
                                    <item.icon className="h-8 w-8" />
                                </div>
                            </Link>
                        )
                    }
                    return (
                        <Link 
                            href={item.href} 
                            key={item.href} 
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 text-muted-foreground transition-colors duration-200",
                                isActive && "text-primary font-bold"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
