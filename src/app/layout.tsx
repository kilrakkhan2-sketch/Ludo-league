
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { Bespoke_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";
import { MaintenanceShield } from "@/components/layout/MaintenanceShield";
import { Header } from "@/components/layout/Header"; // Import the Header

const bespoke = Bespoke_Serif({
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
          bespoke.variable
      )}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <FirebaseClientProvider>
                <div className="relative flex min-h-screen flex-col bg-background">
                    <Header />
                    <main className="flex-1">
                        <MaintenanceShield>
                            {children}
                        </MaintenanceShield>
                    </main>
                    {/* Add a Footer component here if you have one */}
                </div>
            </FirebaseClientProvider>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
