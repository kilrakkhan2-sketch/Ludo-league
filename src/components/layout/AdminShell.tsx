
'use client';

import type { ReactNode } from "react";
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
  Trophy,
  ShieldCheck,
  User,
  LogOut,
  Swords,
  Search,
  Users,
  Settings,
  Star,
  Shield,
  Package,
  ArrowLeft,
  Banknote,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
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
import { useUser } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


const navItems = [
  { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/matches", icon: Package, label: "Matches" },
  { href: "/admin/deposits", icon: Banknote, label: "Deposits" },
  { href: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
  { href: "/admin/results", icon: ClipboardList, label: "Results" },
  { href: "/admin/manage-admins", icon: ShieldCheck, label: "Manage Admins" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="bg-card">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-destructive rounded-lg">
                <Shield className="text-destructive-foreground" />
              </div>
              <h1 className="text-xl font-bold font-headline text-destructive">
                Admin Panel
              </h1>
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
             <SidebarMenuItem>
                <SidebarMenuButton href="/dashboard" className="mt-4 text-muted-foreground hover:text-foreground">
                  <ArrowLeft />
                  <span>Back to App</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {loading ? (
             <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-grow group-data-[collapsible=icon]:hidden space-y-1">
                    <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-3 w-32 bg-muted rounded-md animate-pulse"></div>
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
                      src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`}
                      data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="font-medium truncate">{user.displayName || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Admin User'}</p>
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
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-card border-b md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <div className="relative w-full max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 bg-muted/40">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
