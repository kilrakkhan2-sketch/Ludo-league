
'use client';

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home, 
  Swords, 
  Shield, 
  Users, 
  Wallet, 
  LogOut, 
  Menu, 
  User,
  Bell,
  Crown
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { WalletBalance } from './wallet-balance';
import { useAuth, useFirestore } from '@/firebase';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/tournaments', label: 'Tournaments', icon: Crown },
  { href: '/leaderboard', label: 'Leaderboard', icon: Users },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User },
];

function UserAvatar() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user] = useAuthState(auth);
  const [userData] = useDocumentData(user ? doc(firestore, 'users', user.uid) : undefined);
  
  const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Avatar>
      <AvatarImage src={userData?.photoURL} alt={userData?.name} />
      <AvatarFallback>{userData?.name ? getInitials(userData.name) : <User />}</AvatarFallback>
    </Avatar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [user] = useAuthState(auth);
  
  const handleLogout = async () => {
    await signOut(auth);
    // Redirect or handle post-logout state
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      {/* ---- Sidebar (Desktop) ---- */}
      <div className="hidden border-r bg-card lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-bold">
               <div className="p-1 bg-primary rounded-md">
                <Image src="/favicon.ico" alt="LudoLeague Logo" width={24} height={24} />
              </div>
              <span className="font-headline text-lg">LudoLeague</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* ---- Header (Mobile & Desktop) ---- */}
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-40">
           {/* -- Mobile Nav Trigger -- */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <nav className="grid gap-2 text-lg font-medium">
                 <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                   <Image src="/favicon.ico" alt="LudoLeague Logo" width={30} height={30} />
                   <span className="font-headline">LudoLeague</span>
                 </Link>
                 {navLinks.map(link => (
                    <Link key={link.href} href={link.href} className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary">
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
               </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
             {/* You can add a search bar here if needed */}
          </div>

           {/* -- User Menu -- */}
            <div className="flex items-center gap-4">
                <WalletBalance />
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                {user && <UserAvatar />}
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Logout
                </Button>
            </div>
        </header>

        {/* ---- Main Content ---- */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
