
'use client';

import NoSsr from "@/components/NoSsr";
import { UserNav } from "@/components/app/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";


export default function AppHeader() {
    return (
        <div className="flex w-full items-center gap-4">
            <SidebarTrigger className="md:hidden text-primary-foreground hover:text-primary-foreground/80 hover:bg-white/20"/>
            <div className="ml-auto flex-1 sm:flex-initial">
               {/* Future search bar can go here */}
            </div>
            <NoSsr>
                <UserNav />
            </NoSsr>
        </div>
    );
}
