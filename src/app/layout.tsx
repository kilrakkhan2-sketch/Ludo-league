
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";
import { MaintenanceShield } from "@/components/layout/MaintenanceShield";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "LudoLeague - Where Champions are Made",
  description: "The ultimate platform for competitive Ludo. Join tournaments, win prizes, and prove your skill.",
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
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={cn(
          "font-sans antialiased",
          GeistSans.variable,
          playfair.variable
      )}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <FirebaseClientProvider>
                <div className="relative flex min-h-screen flex-col bg-background">
                    <main className="flex-1">
                        <MaintenanceShield>
                            {children}
                        </MaintenanceShield>
                    </main>
                </div>
            </FirebaseClientProvider>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
