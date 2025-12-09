
'use client';

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowLeft, Home, Swords, Wallet, User, LogOut, Menu, Shield } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarMenu,
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
import { useIsMobile } from "@/hooks/use-mobile";

interface AppShellProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
  className?: string;
}

const pagesWithoutNav = ['/match/'];

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/matches/open", icon: Swords, label: "Matches" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminNavItem = {
    href: "/admin/dashboard",
    icon: Shield,
    label: "Admin Panel",
}

export function AppShell({ children, pageTitle, showBackButton = false, className }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading, claims } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const isMobile = useIsMobile();

  const isAdmin = claims?.role && ['superadmin', 'deposit_admin', 'match_admin'].includes(claims.role);

  const hideNav = pagesWithoutNav.some(path => pathname.startsWith(path));
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

  const headerContent = (
    <>
      {showBackButton ? (
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
      ) : (
        <SidebarTrigger>
            <Menu />
        </SidebarTrigger>
      )}
      <h1 className="text-xl font-bold">{pageTitle}</h1>
    </>
  );

  if (hideNav) {
    return <div className="min-h-screen w-full bg-muted/30">{children}</div>;
  }

  return (
    <>
      {/* Mobile View */}
      {isMobile && (
        <div className={cn("flex flex-col h-screen w-full bg-muted/30", className)}>
            <SidebarProvider>
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
                        {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                        {isAdmin && (
                            <SidebarMenuItem>
                                <SidebarMenuButton href={adminNavItem.href}>
                                    <adminNavItem.icon />
                                    <span>{adminNavItem.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                    <SidebarFooter>
                        {loading ? (
                        <div className="flex items-center gap-2 p-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 flex-grow" />
                        </div>
                        ) : user ? (
                            <div className="flex flex-col gap-2">
                                <Button variant="ghost" className="justify-start w-full gap-2 p-2 h-auto" onClick={() => router.push('/profile')}>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile?.photoURL || undefined} />
                                        <AvatarFallback>{profile?.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-medium truncate">{profile?.displayName || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </Button>
                                <Button variant="destructive" onClick={handleLogout}><LogOut className="mr-2"/> Logout</Button>
                            </div>
                        ) : (
                        <Button asChild className="w-full"><Link href="/login">Login</Link></Button>
                        )}
                    </SidebarFooter>
                    </SidebarContent>
                </Sidebar>
                
                <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 z-10 shadow-md shrink-0">
                    {headerContent}
                </header>
                <main className="flex-grow overflow-y-auto pb-16">
                    {children}
                </main>
                <BottomNav />
            </SidebarProvider>
        </div>
      )}

      {/* Desktop View */}
      {!isMobile && (
        <div className={cn("min-h-screen w-full bg-muted/30", className)}>
          <SidebarProvider>
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
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton href={item.href} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {isAdmin && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href={adminNavItem.href} tooltip={adminNavItem.label}>
                            <adminNavItem.icon />
                            <span>{adminNavItem.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
                <SidebarFooter>
                  {loading ? (
                    <div className="flex items-center gap-2 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 flex-grow" />
                    </div>
                  ) : user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="justify-start w-full gap-2 p-2 h-auto">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.photoURL || undefined} />
                            <AvatarFallback>{profile?.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                            <p className="font-medium truncate">{profile?.displayName || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                        <DropdownMenuLabel>{profile?.displayName || user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/profile')}>
                          <User className="mr-2 h-4 w-4" /><span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" /><span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button asChild className="w-full"><Link href="/login">Login</Link></Button>
                  )}
                </SidebarFooter>
              </SidebarContent>
            </Sidebar>

            <SidebarInset className="flex flex-col max-h-screen">
              <header className="p-4 border-b shrink-0 flex items-center gap-4">
                <div className="sm:hidden">
                    {headerContent}
                </div>
                <h1 className="text-2xl font-bold hidden sm:block">{pageTitle}</h1>
              </header>
              <div className="flex-grow overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )}
    </>
  );
}
