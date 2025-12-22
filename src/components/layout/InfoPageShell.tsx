
'use client';

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoPageShellProps {
  children: ReactNode;
  pageTitle: string;
  className?: string;
}

export function InfoPageShell({ children, pageTitle, className }: InfoPageShellProps) {
  const router = useRouter();

  return (
    <div className={cn("min-h-screen w-full bg-background", className)}>
      <header className="bg-card p-4 flex items-center justify-between gap-4 z-10 shadow-sm shrink-0 border-b sticky top-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">{pageTitle}</h1>
          </div>
      </header>
      <main className="flex-grow">
          {children}
      </main>
    </div>
  );
}
