
'use client';

import { ReactNode, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Wallet,
  User,
  LogOut,
  Search,
  Users,
  Settings,
  Shield,
  Package,
  ArrowLeft,
  Banknote,
  ClipboardList,
  Menu,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "../ui/input";
import { useUser, useDoc } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types";
import { Skeleton } from "../ui/skeleton";

const allNavItems = [
  { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard", roles: ['superadmin', 'deposit_admin', 'match_admin'] },
  { href: "/admin/users", icon: Users, label: "Users", roles: ['superadmin'] },
  { href: "/admin/manage-admins", icon: Shield, label: "Manage Admins", roles: ['superadmin'] },
  { href: "/admin/matches", icon: Package, label: "Matches", roles: ['superadmin', 'match_admin'] },
  { href: "/admin/results", icon: ClipboardList, label: "Results", roles: ['superadmin', 'match_admin'] },
  { href: "/admin/deposits", icon: Banknote, label: "Deposits", roles: ['superadmin', 'deposit_admin'] },
  { href: "/admin/withdrawals", icon: Wallet, label: "Withdrawals", roles: ['superadmin', 'deposit_admin'] },
  { href: "/admin/settings", icon: Settings, label: "Settings", roles: ['superadmin'] },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading: userLoading, claims } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = claims?.role && ['superadmin', 'deposit_admin', 'match_admin'].includes(claims.role);

  useEffect(() => {
    if (!userLoading && (!user || !isAdmin)) {
      router.push('/login');
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to access this page.',
      });
    }
  }, [user, userLoading, isAdmin, router, toast]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };

  const loading = userLoading || profileLoading;
  const userRole = claims?.role;

  const navItems = allNavItems.filter(item => {
      if (!userRole) return false;
      return item.roles.includes(userRole);
  });

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  if (!isAdmin) {
     return null; // Render nothing while redirecting
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent className="bg-card">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                 <Image src="/favicon.ico" alt="LudoLeague Admin Logo" width={24} height={24} />
              </div>
              <h1 className="text-xl font-bold font-headline text-primary">
                Admin Panel
              </h1>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {loading ? (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton href={item.href} tooltip={item.label}>
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </>
            )}
          </SidebarMenu>
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/dashboard" tooltip="Back to App" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft />
                        <span>Back to App</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            {loading ? (
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-grow group-data-[collapsible=icon]:hidden space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ) : user ? (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                    variant="ghost"
                    className="justify-start w-full gap-2 p-2 h-auto"
                    >
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                        src={profile?.photoURL || undefined}
                        alt={profile?.displayName || 'Admin'}
                        />
                        <AvatarFallback>{profile?.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                        <p className="font-medium truncate">{profile?.displayName || 'Admin User'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                        </p>
                    </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.displayName || 'Admin User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button asChild className="w-full">
                    <Link href="/login">Login</Link>
                </Button>
            )}
        </SidebarFooter>
        </SidebarContent>
        <SidebarInset>
          <header className="flex items-center justify-between p-4 bg-card border-b md:justify-end">
            <div className="md:hidden">
                <SidebarTrigger>
                    <Menu />
                </SidebarTrigger>
            </div>
            <div className="relative w-full max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9" />
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 bg-background/95">{children}</main>
        </SidebarInset>
      </Sidebar>
    </SidebarProvider>
  );
}
