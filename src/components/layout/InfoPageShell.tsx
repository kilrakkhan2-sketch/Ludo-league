
'use client';

import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoPageShellProps {
  children: ReactNode;
  pageTitle: string;
  className?: string;
}

/**
 * A shell for static content pages like Privacy Policy, Terms, etc.
 * It provides a consistent, centered, and readable layout.
 */
export function InfoPageShell({ children, pageTitle, className }: InfoPageShellProps) {
  return (
    <AppShell pageTitle={pageTitle} showBackButton>
      <div className={cn("p-4 sm:p-6 lg:p-8 flex justify-center", className)}>
        <div className="w-full max-w-3xl">
            <Card>
                <CardContent className="p-6">
                    {/* The prose class styles the raw HTML from a CMS or markdown file */}
                    <div className="prose dark:prose-invert max-w-none">
                        {children}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppShell>
  );
}
