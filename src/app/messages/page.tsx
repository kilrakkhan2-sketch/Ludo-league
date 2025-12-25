
'use client';

import { AppShell } from "@/components/layout/AppShell";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <AppShell pageTitle="Messages" showBackButton>
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card w-full max-w-md mx-4">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Message Center</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Private messages with friends and other players will appear here. This feature is coming soon!
          </p>
        </div>
      </div>
    </AppShell>
  );
}
