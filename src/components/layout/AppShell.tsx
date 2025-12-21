
'use client';

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowLeft, Home, Swords, Wallet, User, LogOut, Menu, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useDoc } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/types";
import { Skeleton } from "../ui/skeleton";
import { BottomNav, NavItem } from "./BottomNav"; // Import NavItem
import { useMemo } from "react";

interface AppShellProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
  className?: string;
}

const baseNavItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches/open", icon: Swords, label: "Matches" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppShell({ children, pageTitle, showBackButton = false, className }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading, userData } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

  const isAdmin = useMemo(() => 
    userData?.role && ['superadmin', 'deposit_admin', 'withdrawal_admin', 'match_admin'].includes(userData.role)
  , [userData]);

  const navItems = useMemo(() => {
    let items = [...baseNavItems];
    if (isAdmin) {
      // Add Admin item at a specific position, before Profile
      const profileIndex = items.findIndex(item => item.href === '/profile');
      if (profileIndex !== -1) {
        items.splice(profileIndex, 0, { href: "/admin/dashboard", icon: Shield, label: "Admin" });
      } else {
        // Fallback in case profile is not in the list
        items.push({ href: "/admin/dashboard", icon: Shield, label: "Admin" });
      }
    }
    return items;
  }, [isAdmin]);

  const loading = userLoading || profileLoading;

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({ title: "Logged Out" });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed" });
    }
  };
  
  const userMenu = loading ? (
    <Skeleton className="h-8 w-8 rounded-full" />
  ) : user ? (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photoURL || undefined} alt={profile?.displayName || ''} />
                    <AvatarFallback>{profile?.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
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

  // Loading Skeleton for the whole page to prevent flashes of incorrect UI
  if (userLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
             <div className="p-2 bg-primary rounded-lg">
                <Image src="/favicon.ico" alt="LudoLeague Logo" width={32} height={32} />
            </div>
        </div>
      )
  }

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full bg-background", className)}>
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary rounded-lg">
                  <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
                </div>
                <h1 className="text-xl font-bold font-headline text-primary">LudoLeague</h1>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                      href={item.href} 
                      tooltip={item.label}
                      current={pathname === item.href}
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
             <SidebarFooter>
               {/* This Dropdown is for the collapsed sidebar user menu, can be simplified or match the header one */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photoURL || undefined} alt={profile?.displayName || ''} />
                        <AvatarFallback>{profile?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                          <p className="font-medium truncate">{profile?.displayName || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  {/* Using the same content as the header user menu for consistency */}
                  <DropdownMenuContent className="w-56 mb-2" align="end" side="right" forceMount>
                     <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
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
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>
          
        <div className="flex flex-col h-screen sm:pl-14">
              <header className="bg-card p-4 flex items-center justify-between gap-4 z-10 shadow-sm shrink-0 border-b">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="sm:hidden">
                        <Menu />
                    </SidebarTrigger>
                    {showBackButton && (
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft />
                        </Button>
                    )}
                    <h1 className="text-xl font-bold">{pageTitle}</h1>
                    </div>
                    <div className="hidden sm:block">
                      {userMenu}
                    </div>
              </header>
              <main className="flex-grow overflow-y-auto pb-16 sm:pb-0">
                  {children}
              </main>
              <BottomNav items={navItems} />
        </div>
      </div>
    </SidebarProvider>
  );
}
