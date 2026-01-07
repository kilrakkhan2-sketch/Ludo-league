
'use client';

import Image from "next/image";
import NoSsr from "@/components/NoSsr";
import { UserNav } from "@/components/app/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AppHeader() {
    return (
        <div className="flex w-full items-center gap-4">
            <SidebarTrigger className="md:hidden text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/20"/>
            <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Image src="/icon-192x192.png" alt="Ludo League Logo" width={32} height={32} />
                    <h1 className="text-xl font-bold text-white tracking-wider">Ludo League</h1>
                </div>
            </div>
            <div className="flex items-center justify-end w-24">
                <NoSsr>
                    <UserNav />
                </NoSsr>
            </div>
        </div>
    );
}
