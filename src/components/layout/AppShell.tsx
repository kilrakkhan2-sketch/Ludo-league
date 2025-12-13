
'use client';

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowLeft, Home, Swords, Wallet, User, LogOut, Menu, Shield, UserCog } from "lucide-react"; // Added UserCog
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

const adminNavItems = [
    { href: "/admin/dashboard", icon: Shield, label: "Admin Dashboard" },
    { href: "/admin/manage-users", icon: UserCog, label: "Manage Users" },
];


function SidebarNavigation({ isAdmin, isSuperAdmin, isDesktop = false }: { isAdmin: boolean, isSuperAdmin: boolean, isDesktop?: boolean }) {
    const regularNav = isAdmin ? [] : navItems; // Regular users only see this in admin view if they aren't admins
    const adminNav = isAdmin ? adminNavItems.filter(item => isSuperAdmin || item.href !== '/admin/manage-users') : [];
    const allNavItems = [...regularNav, ...adminNav];
    
    // In non-admin main view, show standard items + admin panel link if admin
    if (!pathname.startsWith('/admin')) {
        const mainNav = [...navItems];
        if (isAdmin) {
            mainNav.push({ href: "/admin/dashboard", icon: Shield, label: "Admin Panel" });
        }
        return (
            <SidebarMenu>
                {mainNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton href={item.href} tooltip={isDesktop ? item.label : undefined}>
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        )
    }

    return (
        <SidebarMenu>
            {allNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton href={item.href} tooltip={isDesktop ? item.label : undefined}>
                    <item.icon />
                    <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            ))}
      </SidebarMenu>
    )
}


export function AppShell({ children, pageTitle, showBackButton = false, className }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading, claims } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

  const isAdmin = claims?.role && ['superadmin', 'deposit_admin', 'match_admin'].includes(claims.role);
  const isSuperAdmin = claims?.role === 'superadmin';
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
  
  // Combine rendering logic for sidebar navigation
  const renderSidebarNav = (isDesktop: boolean) => {
      // Main view navigation
      if (!pathname.startsWith('/admin')) {
          const mainNav = [...navItems];
          if (isAdmin) {
              mainNav.push({ href: "/admin/dashboard", icon: Shield, label: "Admin Panel" });
          }
          return mainNav.map(item => (
              <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} tooltip={isDesktop ? item.label : undefined}>
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          ));
      }
      // Admin view navigation
      const adminNav = adminNavItems.filter(item => isSuperAdmin || item.href !== '/admin/manage-users');
      return adminNav.map(item => (
          <SidebarMenuItem key={item.href}>
              <SidebarMenuButton href={item.href} tooltip={isDesktop ? item.label : undefined}>
                  <item.icon />
                  <span>{item.label}</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
      ));
  }


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
            {isSuperAdmin && (
                <DropdownMenuItem onClick={() => router.push('/admin/manage-users')}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Manage Users</span>
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  if (hideNav) {
    return <div className="min-h-screen w-full bg-muted/30">{children}</div>;
  }
  
  const sidebarHeader = (
    <SidebarHeader>
        <div className="flex items-center gap-2">
        <div className="p-2 bg-primary rounded-lg">
            <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
        </div>
        <h1 className="text-xl font-bold font-headline text-primary">LudoLeague</h1>
        </div>
    </SidebarHeader>
  )

  const mobileSidebarFooter = (
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
  )

  // Loading Skeleton for the whole page to prevent flashes of incorrect UI
  if (loading) {
      return (
        <div className="flex h-screen w-full bg-muted/30">
            <div className="hidden md:flex w-14 h-full border-r p-2 flex-col items-center gap-2"><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="w-8 h-8" /><Skeleton className="w-8 h-8" /><Skeleton className="w-8 h-8" /></div>
            <div className="flex-1 p-4"><Skeleton className="h-full w-full"/></div>
        </div>
      )
  }

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full bg-muted/30", className)}>
          {/* Mobile Layout */}
          <div className="md:hidden">
            <Sidebar>
                <SidebarContent>
                    {sidebarHeader}
                    <SidebarMenu>{renderSidebarNav(false)}</SidebarMenu>
                    {mobileSidebarFooter}
                </SidebarContent>
            </Sidebar>
            
            <div className="flex flex-col h-screen w-full">
              <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 z-10 shadow-md shrink-0">
                  <div className="flex items-center gap-4">
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
                    </div>
              </header>
              <main className="flex-grow overflow-y-auto pb-20">
                  {children}
              </main>
              <BottomNav />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            {pathname.startsWith('/admin') ? (
                <Sidebar>
                    <SidebarContent>
                        {sidebarHeader}
                        <SidebarMenu>{renderSidebarNav(true)}</SidebarMenu>
                        <SidebarFooter>{userMenu}</SidebarFooter>
                    </SidebarContent>
                    <SidebarInset>
                      <header className="p-4 border-b shrink-0 flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold">{pageTitle}</h1>
                        {userMenu}
                      </header>
                      <div className="flex-grow overflow-y-auto p-4 lg:p-6">{children}</div>
                    </SidebarInset>
                </Sidebar>
             ) : (
               <div className="flex flex-col max-h-screen">
                  <header className="p-4 border-b shrink-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
                        </div>
                        <h1 className="text-xl font-bold font-headline text-primary">LudoLeague</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {navItems.map(item => (
                            <Button key={item.href} variant={pathname.startsWith(item.href) ? "secondary" : "ghost"} asChild>
                                <Link href={item.href}>{item.label}</Link>
                            </Button>
                        ))}
                        {userMenu}
                    </div>
                  </header>
                  <div className="flex-grow overflow-y-auto">
                    <div className="p-4 lg:p-6">
                        <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
                        {children}
                    </div>
                  </div>
               </div>
             )}
          </div>
      </div>
    </SidebarProvider>
  );
}
