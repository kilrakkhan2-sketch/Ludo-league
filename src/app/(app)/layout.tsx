
'use client';
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/app/main-nav";
import { UserNav } from "@/components/app/user-nav";
import { Swords } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/app/bottom-nav";
import { cn } from "@/lib/utils";

const pageTitles: { [key: string]: string } = {
  "/dashboard": "Lobby",
  "/tournaments": "Tournaments",
  "/leaderboard": "Leaderboard",
  "/wallet": "My Wallet",
  "/kyc": "KYC Verification",
};

const getTitle = (path: string) => {
  if (path.startsWith('/match/')) return 'Match Room';
  if (path.startsWith('/tournaments/')) return 'Tournament Details';
  return pageTitles[path] || "Ludo League";
};


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 w-full border-b bg-card">
          <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
             <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <Swords className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Ludo League</span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Swords className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold tracking-tight">Ludo League</h1>
                </Link>
                <MainNav className="flex items-baseline space-x-4" />
            </div>

            <div className="flex flex-1 items-center justify-end space-x-4">
              <nav className="flex items-center space-x-1">
                <UserNav />
              </nav>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pt-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </>
  )
}
