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
      <body className={cn("font-body antialiased bg-background")}>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="w-full overflow-x-hidden">
                <div className="bg-background">
                    {children}
                </div>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
