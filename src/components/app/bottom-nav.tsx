'use client';

import { Home, Swords, User, Wallet, BarChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import NoSsr from '@/components/NoSsr';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/lobby', icon: Swords, label: 'Play' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/leaderboard', icon: BarChart, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
      <NoSsr>
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 px-2 bg-gradient-to-t from-primary-start to-primary-end shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.2)]">
            <div className="relative flex items-center justify-around h-full">

                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-end w-16 h-full"
                        >
                            <motion.div
                                className="absolute"
                                animate={{ y: isActive ? -24 : 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200",
                                    isActive ? "bg-white shadow-lg" : "bg-transparent"
                                )}>
                                    <Icon className={cn("h-6 w-6 transition-colors", isActive ? "text-primary" : "text-white")} />
                                </div>
                            </motion.div>

                            <span className={cn(
                                "text-xs font-medium pb-1",
                                isActive ? "text-white font-bold" : "text-white/70"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
      </NoSsr>
    );
}
