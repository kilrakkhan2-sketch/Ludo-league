
'use client';

import Link from "next/link";
import { UserNav } from "@/components/app/user-nav";
import { Swords } from "lucide-react";

export default function AppHeader() {
    return (
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
               {/* Future search bar can go here */}
            </div>
            <UserNav />
        </div>
    );
}
