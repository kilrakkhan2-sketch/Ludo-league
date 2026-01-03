"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Wallet, ShieldCheck, Trophy, BarChart, Swords } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/lobby", label: "Lobby", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Ranks", icon: BarChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  // { href: "/kyc", label: "KYC", icon: ShieldCheck },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-primary text-primary-foreground border-t border-primary/20 shadow-t-lg md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "inline-flex flex-col items-center justify-center px-2 hover:bg-primary-foreground/10 group",
              isActive ? "text-white" : "text-primary-foreground/70"
            )}>
              <item.icon className={cn("w-6 h-6 mb-1 transition-transform", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
