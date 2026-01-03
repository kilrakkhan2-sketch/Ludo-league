
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
} from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet"

const AdminSidebarNav = () => {
  const pathname = usePathname()
  const navItems = [
    { href: "/admin/dashboard", label: "Fraud Dashboard", icon: ShieldAlert },
    { href: "/admin/deposits", label: "Deposits", icon: WalletCards },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: Download },
    { href: "/admin/matches", label: "Matches", icon: Trophy },
    { href: "/admin/kyc-requests", label: "KYC Requests", icon: Users },
  ]
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={pathname === item.href}
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
        { href: "/admin/deposits", label: "Deposits", icon: WalletCards },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: Download },
        { href: "/admin/matches", label: "Matches", icon: Trophy },
        { href: "/admin/kyc-requests", label: "KYC Requests", icon: ShieldCheck },
    ]


  return (
    <SidebarProvider>
      <div className="min-h-screen md:flex">
        <div className="hidden md:block">
            <Sidebar className="border-r bg-background">
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
        </div>

        <main className="flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="sm:hidden">
                            <PanelLeft className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs bg-background">
                       <SheetHeader className="text-left">
                          <SheetTitle>
                            <SheetClose asChild>
                                <Link
                                    href="/dashboard"
                                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                                >
                                    <Swords className="h-5 w-5 transition-all group-hover:scale-110" />
                                    <span className="sr-only">Ludo League</span>
                                </Link>
                            </SheetClose>
                          </SheetTitle>
                          <SheetDescription>
                            Admin navigation menu
                          </SheetDescription>
                        </SheetHeader>
                        <nav className="grid gap-6 text-lg font-medium mt-4">
                            {navItems.map(item => (
                                <SheetClose asChild key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn("flex items-center gap-4 px-2.5",
                                            pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                 <Link href="/dashboard" className="flex items-center gap-2">
                    <Swords className="h-6 w-6 text-primary" />
                    <span className="font-bold">Admin Panel</span>
                </Link>
            </header>
            <div className="p-4 sm:p-6 md:p-8">
                {children}
            </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
