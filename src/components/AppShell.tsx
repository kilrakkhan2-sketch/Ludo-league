
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Trophy, Wallet, User as UserIcon, Menu, Bell, Settings, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth } from '@/firebase';
import MobileNav from './MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalance } from '@/hooks/useBalance';

const mainNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/lobby', icon: Swords, label: 'Game Lobby' },
  { href: '/tournaments', icon: Trophy, label: 'Tournaments' },
  { href: '/wallet', icon: Wallet, label: 'My Wallet' },
];

const userNavItems = [
  { href: '/profile', icon: UserIcon, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        { 'bg-muted text-primary': isActive },
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SidebarContent() {
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-background">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Swords className="h-6 w-6 text-primary" />
          <span className="">Ludo League</span>
        </Link>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {mainNavItems.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
         {user && (
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">Player</p>
              </div>
            </div>
          )}
        <nav className="grid gap-1">
           {userNavItems.map((item) => <NavLink key={item.href} {...item} />)}
           {user?.isAdmin && <NavLink href="/admin" icon={ShieldCheck} label="Admin Panel" />}
        </nav>
        <Button variant="ghost" className="w-full justify-start mt-4" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4"/>
            Logout
        </Button>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const { balance } = useBalance();

  if (loading) {
    // This loader will be updated later
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-muted/40 flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar (Desktop) */}
      <div className="hidden border-r bg-background md:block">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header (Mobile) */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 md:hidden sticky top-0 z-40">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Swords className="h-6 w-6 text-primary" />
                            <span className="">Ludo League</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center font-semibold text-lg">Ludo League</div>
           <Link href="/wallet">
            <div className="flex items-center gap-2 border rounded-full px-3 py-1 bg-primary/10 text-primary font-bold">
                <Wallet className="h-4 w-4"/>
                <span>₹{balance.toFixed(2)}</span>
            </div>
          </Link>
        </header>
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0 md:gap-8 md:p-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={usePathname()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
