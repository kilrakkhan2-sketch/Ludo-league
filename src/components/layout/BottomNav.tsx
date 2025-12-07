
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/matches/open", icon: Swords, label: "Matches" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-around items-center h-full max-w-sm mx-auto">
                {navItems.map((item) => {
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
