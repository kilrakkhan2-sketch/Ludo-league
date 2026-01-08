
'use client';

import Image from "next/image";
import Link from "next/link";
import NoSsr from "@/components/NoSsr";
import { UserNav } from "@/components/app/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { Wallet2 } from "lucide-react";

const WalletBalance = () => {
    const { user, loading, error } = useUser();
    
    // Do not render anything if loading, or if the user/balance is unavailable
    if (loading || error || !user || typeof user.walletBalance === 'undefined') {
      return null;
    }
  
    return (
        <Link href="/wallet">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20 transition-colors duration-200 cursor-pointer">
                <Wallet2 className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wider">₹{user.walletBalance.toFixed(2)}</span>
            </div>
      </Link>
    );
  };
  

export default function AppHeader() {
    return (
        <div className="flex w-full items-center gap-4">
            <SidebarTrigger className="md:hidden text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/20"/>
            <div className="flex-1 text-center md:flex-none">
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <Image src="/icon-192x192.png" alt="Ludo League Logo" width={32} height={32} />
                    <h1 className="text-xl font-bold text-white tracking-wider">Ludo League</h1>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
                <NoSsr>
                    <WalletBalance />
                </NoSsr>
                <NoSsr>
                    <UserNav />
                </NoSsr>
            </div>
        </div>
    );
}
