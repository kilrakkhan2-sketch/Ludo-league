

'use client';

import {
  Home,
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
  Ticket,
  Menu,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useUser, useCollection } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Separator } from '../ui/separator';

const NavItem = ({ href, icon: Icon, label, count }: { href: string; icon: React.ElementType; label: string, count?: number }) => {
  const pathname = usePathname();
  const isActive = pathname ? pathname.startsWith(href) : false;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
        isActive
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && count > 0 && <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{count}</span>}
    </Link>
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
  const { count: disputedMatches } = useCollection("matches", { where: ["status", "==", "disputed"] });

  const navItems = {
    main: [
      { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
      { href: '/admin/users', icon: Users, label: 'All Users' },
      { href: '/admin/manage-admins', icon: UserCog, label: 'Manage Roles' },
    ],
    management: [
      { href: '/admin/matches', icon: Award, label: 'Matches', count: (pendingMatches || 0) + (disputedMatches || 0) },
      { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits', count: pendingDeposits },
      { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals', count: pendingWithdrawals },
      { href: '/admin/kyc', icon: FileBadge, label: 'KYC', count: pendingKyc },
      { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
    ],
    config: [
      { href: '/admin/tournaments', icon: Ticket, label: 'Tournaments' },
      { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
      { href: '/admin/upi-management', icon: Banknote, label: 'UPI Management' },
      { href: '/admin/storage', icon: HardDrive, label: 'Storage' },
      { href: '/admin/status', icon: Power, label: 'App Status' },
      { href: '/admin/settings', icon: Settings, label: 'App Settings' },
    ]
  };

  const getNavForRole = (role?: UserProfile['role']) => {
    switch (role) {
      case 'superadmin':
        return [
          { title: 'Main', items: navItems.main },
          { title: 'Management', items: navItems.management },
          { title: 'Configuration', items: navItems.config },
        ];
      case 'deposit_admin':
        return [{ title: 'Management', items: [navItems.management.find(i => i.href.includes('deposits'))!] }];
      case 'withdrawal_admin':
        return [{ title: 'Management', items: [navItems.management.find(i => i.href.includes('withdrawals'))!] }];
      case 'match_admin':
        return [{ title: 'Management', items: [navItems.management.find(i => i.href.includes('matches'))!, navItems.config.find(i => i.href.includes('tournaments'))!] }];
      default:
        return [];
    }
  }

  const navigationStructure = getNavForRole(userData?.role);
  const currentNav = [...navItems.main, ...navItems.management, ...navItems.config].find(item => pathname && pathname.startsWith(item.href));
  const title = pageTitle || currentNav?.label || 'Admin Panel';

  const SidebarContent = () => (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navigationStructure.map(group => (
        <div key={group.title} className="py-2">
           <h3 className="mb-2 px-4 text-lg font-semibold tracking-tight">{group.title}</h3>
           <div className="space-y-1">
             {group.items.map(item => <NavItem key={item.href} {...item} />)}
           </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6 text-primary" />
              <span className="">Admin Panel</span>
            </Link>
          </div>
          <div className="flex-1">
            <SidebarContent />
          </div>
          <div className="mt-auto p-4">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard">
                  <LogOut className="mr-2 h-4 w-4 rotate-180" />
                  Exit Admin
                </Link>
              </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-card">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="">Admin Panel</span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                 <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.photoURL || undefined} alt={userData?.displayName || ''} />
                    <AvatarFallback>{userData?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
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
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
