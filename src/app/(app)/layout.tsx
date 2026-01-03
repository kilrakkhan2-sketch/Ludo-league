
'use client';
import { usePathname, useRouter } from "next/navigation";
import { UserNav } from "@/components/app/user-nav";
import { Swords, PanelLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/app/bottom-nav";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Swords as LobbyIcon, Trophy, BarChart, Wallet, ShieldCheck, FileText, Landmark, Shield, Gavel, FileBadge, User, Settings } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

const pageTitles: { [key: string]: string } = {
  "/dashboard": "Home",
  "/lobby": "Match Lobby",
  "/tournaments": "Tournaments",
  "/leaderboard": "Leaderboard",
  "/wallet": "My Wallet",
  "/kyc": "KYC Verification",
  "/profile": "My Profile",
  "/settings": "Settings",
  "/privacy-policy": "Privacy Policy",
  "/terms-and-conditions": "Terms & Conditions",
  "/refund-policy": "Refund Policy",
  "/gst-policy": "GST Policy",
};

const getTitle = (path: string) => {
  if (path.startsWith('/match/')) return 'Match Room';
  if (path.startsWith('/tournaments/')) return 'Tournament Details';
  return pageTitles[path] || "Ludo League";
};

const AppSidebarNav = () => {
    const pathname = usePathname();
    const navItems = [
      { href: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
      { href: "/lobby", label: "Lobby", icon: LobbyIcon, active: pathname.startsWith('/lobby') || pathname.startsWith('/match') },
      { href: "/tournaments", label: "Tournaments", icon: Trophy, active: pathname.startsWith('/tournaments') },
      { href: "/leaderboard", label: "Leaderboard", icon: BarChart, active: pathname === "/leaderboard" },
      { href: "/wallet", label: "Wallet", icon: Wallet, active: pathname === "/wallet" },
      { href: "/kyc", label: "KYC", icon: ShieldCheck, active: pathname === "/kyc" },
      { href: "/profile", label: "Profile", icon: User, active: pathname === "/profile" },
      { href: "/settings", label: "Settings", icon: Settings, active: pathname === "/settings" },
    ];
     const legalItems = [
        { href: "/privacy-policy", label: "Privacy Policy", icon: Shield },
        { href: "/terms-and-conditions", label: "Terms & Conditions", icon: Gavel },
        { href: "/refund-policy", label: "Refund Policy", icon: Landmark },
        { href: "/gst-policy", label: "GST Policy", icon: FileBadge },
    ];

    return (
        <div className="flex flex-col h-full">
            <SidebarMenu className="flex-1">
                {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton isActive={item.active} className="justify-start">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            <div className="mt-auto">
                <div className="p-2">
                    <p className="text-xs text-sidebar-foreground/70 px-2 font-medium">Legal & Policies</p>
                </div>
                <SidebarMenu>
                     {legalItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton isActive={pathname === item.href} className="justify-start">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            </SidebarMenuButton>
                        </Link>
                        </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                        <Link href="/admin/dashboard">
                            <SidebarMenuButton className="justify-start text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200">
                                <FileText className="h-4 w-4" />
                                Admin Panel
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
        </div>
    )
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-muted/20">
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
                        <div className="container flex h-16 items-center justify-between space-x-4">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Swords className="h-6 w-6" />
                                <span className="font-bold text-lg">Ludo League</span>
                            </Link>
                            <div className="flex items-center gap-2">
                                <UserNav />
                                <Button size="icon" variant="ghost">
                                    <PanelLeft className="h-6 w-6" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </div>
                        </div>
                    </header>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-sidebar text-sidebar-foreground w-3/4">
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
                    <div className="p-2">
                      <AppSidebarNav />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
        
        <div className="hidden md:flex">
             <Sidebar>
                <SidebarHeader>
                     <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary">
                        <Swords className="h-6 w-6" />
                        <h1 className="text-xl font-bold tracking-tight">Ludo League</h1>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <AppSidebarNav />
                </SidebarContent>
            </Sidebar>
            <div className="flex flex-col flex-1">
                {/* Top App Bar for Desktop */}
                <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
                <div className="container flex h-16 items-center justify-end space-x-4">
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <UserNav />
                    </div>
                </div>
                </header>

                 {/* Page Banner */}
                <div className="bg-card shadow-sm">
                    <div className="container py-4">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h2>
                    </div>
                </div>
                
                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 pt-6 pb-24 md:pb-8">
                {children}
                </main>
            </div>
        </div>

        {/* Mobile content when sidebar is not open */}
        <div className="md:hidden">
            {/* Page Banner */}
            <div className="bg-card shadow-sm">
                <div className="container py-4">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {title}
                    </h2>
                </div>
            </div>
            
            {/* Page Content */}
            <main className="flex-1 p-4 md:p-8 pt-6 pb-24 md:pb-8">
            {children}
            </main>
        </div>
      </div>

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </SidebarProvider>
  )
}
