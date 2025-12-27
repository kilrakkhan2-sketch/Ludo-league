
'use client';

import type { ReactNode } from "react";
import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { ArrowLeft, Menu, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { AppShellSkeleton } from "../app-shell-skeleton";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav, NavItem } from "./BottomNav";
import {
    Home, 
    Swords, 
    User,
    Trophy,
    PlusCircle,
    Wallet,
    Users,
    BarChart,
    ShieldCheck,
    Info,
    FileText,
    Lock,
    File,
    Mail
} from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
  showBackButton?: boolean;
}

const bottomNavItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches", icon: Swords, label: "Matches" },
  { href: "/create-match", icon: PlusCircle, label: "Create", isCentral: true },
  { href: "/tournaments", icon: Trophy, label: "Tournaments" },
  { href: "/profile", icon: User, label: "Profile" },
];

const sidebarNavItems: NavItem[] = [
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/refer", icon: Users, label: "Refer & Earn" },
    { href: "/leaderboard", icon: BarChart, label: "Leaderboard" },
    { href: "/kyc", icon: ShieldCheck, label: "KYC" },
    { href: "/about", icon: Info, label: "About Us" },
    { href: "/terms", icon: FileText, label: "Terms of Service" },
    { href: "/privacy", icon: Lock, label: "Privacy Policy" },
    { href: "/gst-policy", icon: File, label: "GST Policy" },
    { href: "/contact", icon: Mail, label: "Contact Us" },
];


export function AppShell({ children, pageTitle, showBackButton = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, userData } = useUser();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isAdmin = useMemo(() => 
    userData?.role && ['superadmin', 'deposit_admin', 'withdrawal_admin', 'match_admin'].includes(userData.role)
  , [userData]);


  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed" });
    }
  };
  
  if (loading) {
      return <AppShellSkeleton />;
  }

  if (!user && !loading) {
    router.replace('/login');
    return <AppShellSkeleton />;
  }
  
  const userMenu = user ? (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarImage src={userData?.photoURL || undefined} alt={userData?.displayName || ''} />
                    <AvatarFallback>{userData?.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile?tab=settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const finalPageTitle = pageTitle || pathname?.split('/').pop()?.replace('-', ' ') || 'LudoLeague';

  return (
    // Max-width container for a more app-like feel on larger screens
    <div className="w-full max-w-lg mx-auto bg-background shadow-2xl shadow-primary/5">
        <div className="flex flex-col h-screen">
            {/* Main App Bar */}
            <header className="bg-card p-3 sm:p-4 flex items-center justify-between gap-4 z-10 shrink-0 border-b">
                <div className="flex items-center gap-1">
                  {showBackButton ? (
                      <Button variant="ghost" size="icon" onClick={() => router.back()}>
                          <ArrowLeft />
                      </Button>
                  ) : (
                    <div className="sm:hidden">
                      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Menu />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64">
                          <div className="flex items-center mb-6">
                              <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setIsSheetOpen(false)}>
                                  <Image src="/logo.svg" width={24} height={24} alt="LudoLeague" />
                                  <span>LudoLeague</span>
                              </Link>
                          </div>
                          <nav className="flex flex-col gap-1">
                              {bottomNavItems.filter(i => !i.isCentral).map((item) => (
                                  <Link
                                      key={item.href}
                                      href={item.href}
                                      onClick={() => setIsSheetOpen(false)}
                                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === item.href ? 'bg-muted text-primary' : ''}`}>
                                      <item.icon className="h-4 w-4" />
                                      {item.label}
                                  </Link>
                              ))}
                              <div className="my-2 border-t border-border" />
                              {sidebarNavItems.map((item) => (
                                  <Link
                                      key={item.href}
                                      href={item.href}
                                      onClick={() => setIsSheetOpen(false)}
                                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === item.href ? 'bg-muted text-primary' : ''}`}>
                                      <item.icon className="h-4 w-4" />
                                      {item.label}
                                  </Link>
                              ))}
                          </nav>
                        </SheetContent>
                      </Sheet>
                    </div>
                  )}
                   <h1 className="text-lg sm:text-xl font-bold text-foreground capitalize">{finalPageTitle}</h1>
                </div>
                <div className="flex items-center gap-2">
                  {userMenu}
                </div>
            </header>
            
            {/* Scrollable Content Area */}
            <main className="flex-grow flex flex-col overflow-y-auto bg-muted/40 pb-16">
              {children}
            </main>
            
            {/* Bottom Navigation */}
            <BottomNav items={bottomNavItems} />
        </div>
    </div>
  );
}
