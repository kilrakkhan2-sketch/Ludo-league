import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { MaintenanceShield } from "@/components/layout/MaintenanceShield";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

export const metadata: Metadata = {
  title: "LudoLeague",
  description: "The ultimate platform for competitive Ludo.",
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
      <body className={cn("font-body antialiased", ptSans.variable)}>
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
