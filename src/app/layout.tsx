import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { MaintenanceShield } from "@/components/layout/MaintenanceShield";

export const metadata: Metadata = {
  title: "LudoLeague",
  description: "The ultimate platform for competitive Ludo.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased")}>
        <FirebaseClientProvider>
          <MaintenanceShield>
            {children}
          </MaintenanceShield>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
