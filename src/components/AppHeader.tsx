
'use client';

import Link from "next/link";
import { MainNav } from "@/components/app/main-nav";
import { UserNav } from "@/components/app/user-nav";
import { Swords } from "lucide-react";

export default function AppHeader() {
    return (
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Swords className="h-6 w-6" />
                <span className="">Ludo League</span>
            </Link>
            
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <MainNav className="hidden md:flex"/>
                <div className="ml-auto flex-1 sm:flex-initial">
                   {/* Future search bar can go here */}
                </div>
                <UserNav />
            </div>
        </header>
    );
}
