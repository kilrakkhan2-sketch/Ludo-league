
'use client';

import Link from 'next/link';
import { useUser, useDoc } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Crown, Swords, Trophy, Wallet, User as UserIcon, LogOut, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserProfile } from '@/types';
import { cn } from '@/lib/utils';

const NavLink = ({ href, children, className }: { href: string; children: React.ReactNode, className?: string }) => (
  <Link href={href} className={cn("text-sm font-medium text-muted-foreground hover:text-primary transition-colors", className)}>
    {children}
  </Link>
);

const ThemeToggle = () => {
    const { setTheme, theme } = useTheme();
    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

const UserButton = ({ user, profile }: { user: any; profile: UserProfile | null }) => {
    const { auth } = useFirebase();
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    const isAdmin = profile?.role === 'superadmin';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/wallet')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                </DropdownMenuItem>
                {isAdmin && (
                     <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
  const { user, loading } = useUser();
  const { data: profile } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Crown className="h-6 w-6 text-primary" />
          <span className="font-bold font-serif text-lg tracking-tighter">LudoLeague</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
            <NavLink href="/play"><Swords className="h-4 w-4 mr-1 inline"/> Play Now</NavLink>
            <NavLink href="/tournaments"><Trophy className="h-4 w-4 mr-1 inline"/> Tournaments</NavLink>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
            {!loading && user && profile && (
                 <div className="hidden sm:flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary"/>
                    <span className="font-bold text-md">₹{profile.walletBalance?.toFixed(2) || '0.00'}</span>
                </div>
            )}
            <ThemeToggle />
            {loading ? <div className="h-10 w-10 rounded-full bg-muted animate-pulse" /> : user ? <UserButton user={user} profile={profile} /> : <Button asChild><Link href="/login">Login</Link></Button>}
        </div>
      </div>
    </header>
  );
}
