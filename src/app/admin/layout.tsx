
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Sword,
  CircleArrowUp,
  Landmark,
  FileKey,
  ShieldAlert,
  Ticket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// Define navigation items
const navItems = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/deposits', icon: CircleArrowUp, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals' },
  { href: '/admin/kyc', icon: FileKey, label: 'KYC Requests' },
  { href: '/admin/matches', icon: Sword, label: 'Matches' },
  { href: '/admin/tournaments', icon: Ticket, label: 'Tournaments' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

const AdminSidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  return (
    <div className={className}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Ludo King</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                  pathname === item.href ? 'bg-muted text-primary' : ''
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, error, signOut } = useUser();
  const router = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading admin...</p>
      </div>
    );
  }

  if (error || !user) {
     return (
      <div className="flex items-center justify-center h-screen">
        <p>You must be logged in to view this page.</p>
        <Button asChild><Link href="/login">Login</Link></Button>
      </div>
    );
  }
  
  if (!['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'].includes(user.role || '')) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className='text-2xl font-bold'>Access Denied</h1>
        <p>You do not have permission to view the admin panel.</p>
        <Button asChild><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <AdminSidebar />
      </div>
      
      {/* Mobile Header & Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Sidebar Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Can add breadcrumbs or search here if needed */}
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href='/profile'}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href='/'}>App</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

