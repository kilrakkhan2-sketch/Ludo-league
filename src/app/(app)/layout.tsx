import { MainNav } from "@/components/app/main-nav";
import { UserNav } from "@/components/app/user-nav";
import { Swords } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/app/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex-col md:flex">
        {/* Top navigation for desktop */}
        <div className="border-b hidden md:block">
          <div className="flex h-16 items-center px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold tracking-tight">Ludo League</h1>
            </Link>
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </>
  )
}
