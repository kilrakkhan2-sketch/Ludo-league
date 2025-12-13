import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "LudoLeague",
  description: "The ultimate platform for competitive Ludo.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn("font-body antialiased")}>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="w-full min-h-screen overflow-x-hidden">
              {children}
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
