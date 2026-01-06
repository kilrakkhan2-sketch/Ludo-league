
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Swords, Trophy, LifeBuoy, Wallet } from "lucide-react"
import { motion } from 'framer-motion';

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/lobby", label: "Lobby", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm md:hidden">
      <div className="relative flex h-16 items-center justify-around rounded-full border bg-card/70 p-2 shadow-lg backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/lobby' && pathname.startsWith('/match')) || (item.href === '/dashboard' && pathname === '/');
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "relative z-10 flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-full text-center text-muted-foreground transition-colors group",
                { "text-primary": isActive }
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className={cn(
                "text-[10px] font-bold opacity-0 transition-opacity, duration-300",
                { "opacity-100": isActive }
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
