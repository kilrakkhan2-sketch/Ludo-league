
'use client';

import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { ArrowLeft, Home, Swords, Wallet, User, LogOut, Menu, Shield, Users as FriendsIcon, Trophy } from "lucide-react";

import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { AppShellSkeleton } from "../app-shell-skeleton";
import { Button } from "../ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkle } from "../ui/sparkle";
import { BottomNav, NavItem } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
}

const baseNavItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches", icon: Swords, label: "Matches" },
  { href: "/tournaments", icon: Trophy, label: "Tournaments" },
  { href: "/friends", icon: FriendsIcon, label: "Friends" },
  { href: "/wallet/history", icon: Wallet, label: "Wallet" },
  { href: "/profile", icon: User, label: "Profile" },
];

const bottomNavItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches", icon: Swords, label: "Matches" },
  { href: "/create-match", icon: PlusCircle, label: "Create", isCentral: true },
  { href: "/tournaments", icon: Trophy, label: "Tournaments" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppShell({ children, pageTitle, showBackButton = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, userData } = useUser();

  const isAdmin = useMemo(() => 
    userData?.role && ['superadmin', 'deposit_admin', 'withdrawal_admin', 'match_admin'].includes(userData.role)
  , [userData]);

  const navItems = useMemo(() => {
    let items = [...baseNavItems];
    if (isAdmin) {
      items.push({ href: "/admin/dashboard", icon: Shield, label: "Admin" });
    }
    return items;
  }, [isAdmin]);

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
                <Avatar className="h-8 w-8 border border-border/50">
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
            <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full bg-background text-foreground")}>
        <Sidebar className="bg-card border-r border-border/50">
          <SidebarContent>
            <SidebarHeader>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Sparkle>
                  <div className="p-2 bg-primary rounded-lg">
                    <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
                  </div>
                </Sparkle>
                <h1 className="text-xl font-bold font-headline text-primary">LudoLeague</h1>
              </Link>
            </SidebarHeader>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                      href={item.href} 
                      tooltip={item.label}
                      current={pathname === item.href}
                      className={cn(
                        "text-card-foreground/80 hover:text-card-foreground hover:bg-accent/40",
                        pathname === item.href && "text-primary bg-primary/20 hover:bg-primary/30 hover:text-primary"
                      )}
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
             <SidebarFooter>
                {userMenu}
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>
          
        <div className="flex flex-col h-screen sm:pl-14">
              <header className="bg-card p-3 sm:p-4 flex items-center justify-between gap-4 z-10 shrink-0 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="sm:hidden">
                        <Menu />
                    </SidebarTrigger>
                    {showBackButton && (
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft />
                        </Button>
                    )}
                     <Sparkle>
                      <h1 className="text-lg sm:text-xl font-bold text-primary capitalize">{pageTitle}</h1>
                     </Sparkle>
                    </div>
                    <div className="hidden sm:block">
                      {userMenu}
                    </div>
              </header>
              <main className="flex-grow overflow-y-auto pb-16 sm:pb-0 bg-muted/20">
                  {children}
              </main>
              <BottomNav items={bottomNavItems} />
        </div>
      </div>
    </SidebarProvider>
  );
}
