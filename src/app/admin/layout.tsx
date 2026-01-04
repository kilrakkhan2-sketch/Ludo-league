
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Swords,
  LayoutDashboard,
  WalletCards,
  ShieldAlert,
  PanelLeft,
  Home,
  Trophy,
  Users,
  ShieldCheck,
  Download,
  FolderKanban,
  AtSign,
  Gift,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { UserNav } from "@/components/app/user-nav"

const AdminSidebarNav = () => {
  const pathname = usePathname()
  const [activePath, setActivePath] = useState<string | null>(null);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);


  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/matches", label: "Matches", icon: Trophy },
    { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/admin/deposits", label: "Deposits", icon: WalletCards },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: Download },
    { href: "/admin/kyc-requests", label: "KYC Requests", icon: ShieldCheck },
    { href: "/admin/upi-management", label: "UPI Management", icon: AtSign },
    { href: "/admin/referral-settings", label: "Referral Settings", icon: Gift },
    { href: "/admin/storage", label: "Storage", icon: FolderKanban },
  ]
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={activePath ? activePath.startsWith(item.href) : false}
              className="justify-start"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const [isSheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()
    
    const navItems = [
        { href: "/dashboard", label: "App Lobby", icon: Swords },
        { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/matches", label: "Matches", icon: Trophy },
        { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
        { href: "/admin/deposits", label: "Deposits", icon: WalletCards },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: Download },
        { href: "/admin/kyc-requests", label: "KYC Requests", icon: ShieldCheck },
        { href: "/admin/upi-management", label: "UPI Management", icon: AtSign },
        { href: "/admin/referral-settings", label: "Referral Settings", icon: Gift },
        { href: "/admin/storage", label: "Storage", icon: FolderKanban },
    ]


  return (
    <SidebarProvider>
      <div className="min-h-screen md:flex bg-muted/30">
        <Sidebar className="border-r bg-background hidden md:flex">
            <SidebarHeader className="p-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Swords className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Ludo League</span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <AdminSidebarNav />
            </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-primary text-primary-foreground px-4 sm:h-16">
                 <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="ghost" className="md:hidden hover:bg-primary-foreground/10 hover:text-primary-foreground">
                            <PanelLeft className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0">
                       <SheetHeader className="p-4 border-b border-sidebar-border">
                          <SheetTitle>
                            <SheetClose asChild>
                                <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary">
                                    <Swords className="h-6 w-6" />
                                    <span className="font-bold text-lg">Ludo League</span>
                                </Link>
                            </SheetClose>
                          </SheetTitle>
                        </SheetHeader>
                        <nav className="grid gap-1 p-2 text-lg font-medium mt-4">
                            {navItems.map(item => (
                                <SheetClose asChild key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                                            pathname.startsWith(item.href) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                 <div className="flex-1">
                    <h1 className="font-semibold text-lg">Admin Panel</h1>
                 </div>
                 <UserNav />
            </header>
            <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-x-auto">
              <div className="min-w-[1024px]">
                {children}
              </div>
            </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
