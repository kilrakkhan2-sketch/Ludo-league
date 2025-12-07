
'use client';

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
