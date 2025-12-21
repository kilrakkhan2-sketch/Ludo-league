
'use client';

import {
  Home,
  Package,
  Users,
  Wallet,
  Shield,
  Settings,
  Landmark,
  CircleArrowUp,
  Award,
  LogOut,
  UserCog,
  FileBadge,
  Megaphone,
  Power,
  Banknote
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useUser, useFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';

const superAdminNav = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'All Users' },
  { href: '/admin/manage-admins', icon: UserCog, label: 'Manage Roles' },
  { href: '/admin/matches', icon: Award, label: 'Matches' },
  { href: '/admin/tournaments', icon: Shield, label: 'Tournaments' },
  { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals' },
  { href: '/admin/upi-management', icon: Banknote, label: 'UPI Management' },
  { href: '/admin/kyc', icon: FileBadge, label: 'KYC Management' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
  { href: '/admin/status', icon: Power, label: 'App Status' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const depositAdminNav = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals' },
];

const matchAdminNav = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/matches', icon: Award, label: 'Matches' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/admin/tournaments', icon: Shield, label: 'Tournaments' },
];


export function AdminShell({ children }: { children: React.ReactNode }) {
  const { userData } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const getNavItems = () => {
    switch (userData?.role) {
      case 'superadmin':
        return superAdminNav;
      case 'deposit_admin':
        return depositAdminNav;
      case 'match_admin':
        return matchAdminNav;
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || 'Admin Panel';

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full bg-muted/40">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <Shield className="h-6 w-6" />
                <span>Admin Panel</span>
              </Link>
            </SidebarHeader>
            <SidebarMenu>
               {navItems.map(({ href, icon: Icon, label }) => (
                <SidebarMenuItem key={href}>
                    <SidebarMenuButton 
                        href={href}
                        current={pathname === href}
                        tooltip={label}
                    >
                        <Icon />
                        <span>{label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarFooter>
               <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                <Link href="/dashboard">
                  <LogOut className="rotate-180" />
                  <span>Back to App</span>
                </Link>
              </Button>
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col sm:pl-14">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
              <SidebarTrigger className="sm:hidden" />
              <h1 className="text-xl font-semibold hidden sm:block">{pageTitle}</h1>
               <div className="relative ml-auto flex-1 md:grow-0">
                  {/* Future Search Bar? */}
               </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={userData?.photoURL || undefined} alt={userData?.displayName || ''} />
                            <AvatarFallback>{userData?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/support')}>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>Exit Admin Panel</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
