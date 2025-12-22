
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
  Banknote,
  BadgeCheck
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useUser, useFirebase, useCollection } from '@/firebase';
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Image from 'next/image';

const NavItem = ({ href, icon: Icon, label, count }: { href: string; icon: React.ElementType; label: string, count?: number }) => {
  const pathname = usePathname();
  const isActive = pathname ? pathname.startsWith(href) : false;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        href={href}
        current={isActive}
        tooltip={label}
      >
        <Icon />
        <span>{label}</span>
        {count !== undefined && count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};


export function AdminShell({ children, pageTitle }: { children: React.ReactNode, pageTitle?: string }) {
  const { userData } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { count: pendingDeposits } = useCollection("deposit-requests", { where: ["status", "==", "pending"] });
  const { count: pendingWithdrawals } = useCollection("withdrawal-requests", { where: ["status", "==", "pending"] });
  const { count: pendingKyc } = useCollection("kyc-requests", { where: ["status", "==", "pending"] });
  const { count: pendingMatches } = useCollection("matches", { where: ["status", "==", "verification"] });

  const getNavItems = () => {
    const allNav = {
        dashboard: { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
        users: { href: '/admin/users', icon: Users, label: 'All Users' },
        roles: { href: '/admin/manage-admins', icon: UserCog, label: 'Manage Roles' },
        matches: { href: '/admin/matches', icon: Award, label: 'Matches', count: pendingMatches },
        tournaments: { href: '/admin/tournaments', icon: Shield, label: 'Tournaments' },
        deposits: { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits', count: pendingDeposits },
        withdrawals: { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals', count: pendingWithdrawals },
        upi: { href: '/admin/upi-management', icon: Banknote, label: 'UPI Management' },
        kyc: { href: '/admin/kyc', icon: FileBadge, label: 'KYC Management', count: pendingKyc },
        announcements: { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
        transactions: { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
        status: { href: '/admin/status', icon: Power, label: 'App Status' },
        settings: { href: '/admin/settings', icon: Settings, label: 'Settings' },
    };
    
    switch (userData?.role) {
      case 'superadmin':
        return Object.values(allNav);
      case 'deposit_admin':
        return [allNav.dashboard, allNav.deposits];
      case 'withdrawal_admin':
        return [allNav.dashboard, allNav.withdrawals];
      case 'match_admin':
        return [allNav.dashboard, allNav.matches, allNav.announcements, allNav.tournaments];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const currentNav = navItems.find(item => pathname && pathname.startsWith(item.href));
  const title = pageTitle || currentNav?.label || 'Admin Panel';

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
               {navItems.map((item) => <NavItem key={item.href} {...item} />)}
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
              <h1 className="text-xl font-semibold hidden sm:block">{title}</h1>
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
                    <DropdownMenuItem>Support</DropdownMenuItem>
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
