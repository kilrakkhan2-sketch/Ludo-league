
// @ts-nocheck
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home,
  Menu,
  Package2,
  Users,
  Sword,
  CircleArrowUp,
  Landmark,
  FileKey,
  ShieldAlert,
  Ticket,
  Settings,
  Server,
  Megaphone,
  Banknote,
  ShieldCheck,
  CircleUser,
  ShieldX,
  HardDrive,
  Power
} from 'lucide-react';
import Image from 'next/image';


const allNavItems = {
  main: [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard', roles: ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'] },
  ],
  finance: [
    { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits', roles: ['superadmin', 'deposit_admin'] },
    { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals', roles: ['superadmin', 'withdrawal_admin'] },
    { href: '/admin/transactions', icon: Banknote, label: 'Transactions', roles: ['superadmin'] },
    { href: '/admin/upi-management', icon: Settings, label: 'UPI Settings', roles: ['superadmin', 'deposit_admin'] },
  ],
  users: [
    { href: '/admin/users', icon: Users, label: 'All Users', roles: ['superadmin'] },
    { href: '/admin/kyc', icon: FileKey, label: 'KYC Requests', roles: ['superadmin'] },
    { href: '/admin/manage-admins', icon: ShieldCheck, label: 'Manage Admins', roles: ['superadmin'] },
    { href: '/admin/penalties', icon: ShieldX, label: 'Penalties', roles: ['superadmin'] },
  ],
  game: [
    { href: '/admin/matches', icon: Sword, label: 'Matches', roles: ['superadmin', 'match_admin'] },
    { href: '/admin/tournaments', icon: Ticket, label: 'Tournaments', roles: ['superadmin', 'match_admin'] },
  ],
  platform: [
    { href: '/admin/announcements', icon: Megaphone, label: 'Announcements', roles: ['superadmin'] },
    { href: '/admin/storage', icon: HardDrive, label: 'Storage', roles: ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'] },
    { href: '/admin/status', icon: Power, label: 'App Status', roles: ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'] },
    { href: '/admin/settings', icon: Settings, label: 'App Settings', roles: ['superadmin'] },
  ]
};

const NavSection = ({ title, items, userRole, pathname }: { title: string, items: any[], userRole: string, pathname: string }) => {
  const visibleItems = items.filter(item => userRole && item.roles.includes(userRole));
  if (visibleItems.length === 0) return null;

  return (
    <div className="px-2 lg:px-4 py-2">
      <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {visibleItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname === item.href ? 'bg-muted text-primary' : ''
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  );
};

const AdminSidebar = ({ userRole, className }: { userRole: string, className?: string }) => {
  const pathname = usePathname();
  return (
    <div className={cn("h-full max-h-screen flex-col", className)}>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.svg" alt="LudoLeague Logo" width={32} height={32}/>
            <span>Ludo Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start text-sm font-medium py-4">
             <NavSection title="Main" items={allNavItems.main} userRole={userRole} pathname={pathname} />
             <NavSection title="Users & KYC" items={allNavItems.users} userRole={userRole} pathname={pathname} />
             <NavSection title="Finance" items={allNavItems.finance} userRole={userRole} pathname={pathname} />
             <NavSection title="Game" items={allNavItems.game} userRole={userRole} pathname={pathname} />
             <NavSection title="Platform" items={allNavItems.platform} userRole={userRole} pathname={pathname} />
          </nav>
        </div>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useUser();
  const router = useRouter();
  const auth = getAuth();
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const userRole = userData?.role || '';
  const allowedRoles = ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'];

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Admin Panel...</div>;
  }

  if (!user || !userRole || !allowedRoles.includes(userRole)) {
     return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center p-4">
        <ShieldAlert className='w-16 h-16 text-destructive' />
        <h1 className='text-2xl font-bold'>Access Denied</h1>
        <p className='text-muted-foreground'>You do not have the necessary permissions to access the admin panel.</p>
        <div className='flex gap-4 mt-4'>
          <Button onClick={handleSignOut} variant='secondary'>Logout</Button>
          <Button asChild><Link href="/">Return to App</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <AdminSidebar userRole={userRole} />
      </div>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <AdminSidebar userRole={userRole} />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
             <h1 className="text-lg font-semibold capitalize">{pathname.split('/').pop()?.replace('-', ' ')}</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className='flex flex-col'>
                <span>{userData?.displayName || 'Admin'}</span>
                {userRole && <Badge variant='outline' className='w-fit mt-1'>{userRole}</Badge>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/">Go to App</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
