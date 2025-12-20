
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

interface BottomNavProps {
    items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
    const pathname = usePathname();

    // Hide bottom nav on specific paths if needed
    const hideNav = pathname ? ['/match/'].some(path => pathname.startsWith(path)) : false;
    if (hideNav) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 sm:hidden">
            <div className="flex justify-around items-center h-full">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link href={item.href} key={item.href} className={cn("flex flex-col items-center justify-center gap-1 w-16 text-muted-foreground transition-colors",
                            isActive && "text-primary font-bold"
                        )}>
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
