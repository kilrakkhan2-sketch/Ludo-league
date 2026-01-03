"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Wallet, Shield, User, Swords, ShieldCheck, Trophy, BarChart } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Lobby", icon: Swords },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Ranks", icon: BarChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/kyc", label: "KYC", icon: ShieldCheck },
  // { href: "/admin/dashboard", label: "Admin", icon: Shield },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link key={item.href} href={item.href} className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-muted-foreground/10 group",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
