
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Trophy, Wallet, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/lobby', icon: Swords, label: 'Play' },
  { href: '/tournaments', icon: Trophy, label: 'Tourneys' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/profile', icon: UserIcon, label: 'Profile' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 md:hidden">
      <div className="relative flex items-center justify-around h-16 bg-background/70 backdrop-blur-xl border border-primary/10 shadow-lg rounded-2xl overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link href={item.href} key={item.label} className="relative z-10 flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-colors duration-300 hover:text-primary">

              <motion.div 
                animate={{ y: isActive ? -4 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <item.icon className={cn('h-6 w-6', isActive ? 'text-primary' : '')} />
              </motion.div>
              <span className={cn(
                'text-xs font-medium transition-opacity duration-300',
                { 'text-primary': isActive, 'opacity-70': !isActive }
              )}>
                {item.label}
              </span>
              {isActive && (
               <motion.div
                 layoutId="active-pill"
                 className="absolute -bottom-1 h-1 w-8 bg-primary rounded-full"
                 initial={false}
                 animate={{ opacity: 1 }}
                 transition={{ type: 'spring', stiffness: 500, damping: 30 }}
               />
             )}

            </Link>
          );
        })}
      </div>
    </nav>
  );
}
