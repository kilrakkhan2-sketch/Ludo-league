
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarSheet,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Swords,
  User,
} from "lucide-react"
import { UserNav } from "@/components/app/user-nav"


export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const pathname = usePathname()
    

  return (
    <SidebarProvider>
      <div className="min-h-screen md:flex bg-muted/30">
         {/* --- Desktop Sidebar --- */}
        <aside className="hidden md:block md:w-64 border-r border-border">
          <Sidebar>
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Swords className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Ludo League</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                {/* The Nav is now self-contained with logic for admin pages */}
                <SidebarNav isAdminPage={true}/>
            </SidebarContent>
          </Sidebar>
        </aside>

        {/* --- Mobile Sidebar --- */}
        <SidebarSheet>
            <SidebarNav isAdminPage={true} inSheet={true}/>
        </SidebarSheet>

        <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16">
                 {/* This trigger will only be visible on mobile and will open the SidebarSheet */}
                <SidebarTrigger className="md:hidden"/>
                
                 <div className="flex-1">
                    <h1 className="font-semibold text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground"/> 
                      User Profile
                    </h1>
                 </div>
                 <UserNav />
            </header>
            <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="w-full max-w-full">
                {children}
              </div>
            </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
