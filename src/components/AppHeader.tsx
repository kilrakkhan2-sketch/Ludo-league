
'use client';

import { useState, useEffect } from 'react';
import { UserNav } from "@/components/app/user-nav";

export default function AppHeader() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
               {/* Future search bar can go here */}
            </div>
            {isClient && <UserNav />}
        </div>
    );
}
