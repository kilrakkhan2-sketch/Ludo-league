"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Swords, Trophy, BarChart, Wallet } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/lobby", label: "Lobby", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Ranks", icon: BarChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] h-16 bg-card border shadow-lg rounded-full md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/lobby' && pathname.startsWith('/match'));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "inline-flex flex-col items-center justify-center text-center px-1 group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6 mb-1 transition-transform", isActive ? "scale-110 -translate-y-0.5" : "group-hover:scale-110")} />
                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"></span>}
              </div>
              <span className={cn("text-xs font-medium transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
