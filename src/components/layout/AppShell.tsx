
'use client';

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  showBackButton?: boolean;
  pageTitle?: string;
}

const pagesWithoutNav = ['/match/'];

export function AppShell({ children, showBackButton, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hideNav = pagesWithoutNav.some(path => pathname.startsWith(path));

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
       {pageTitle && (
         <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            )}
            <h1 className="text-xl font-bold">{pageTitle}</h1>
        </header>
       )}
      <div className={`flex-grow ${hideNav ? '' : 'pb-20'}`}>
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
