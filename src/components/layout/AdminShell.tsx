
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LineChart, Package, Package2, ShoppingCart, Swords, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}>
      {children}
    </Link>
  );
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Swords className="h-6 w-6" />
              <span className="">LudoLeague Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink href="/admin/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/admin/matches">
                <Package className="h-4 w-4" />
                Matches
              </NavLink>
              <NavLink href="/admin/users">
                <Users className="h-4 w-4" />
                Users
              </NavLink>
              <NavLink href="/admin/deposits">
                <Wallet className="h-4 w-4" />
                Deposits
              </NavLink>
              <NavLink href="/admin/settings">
                <LineChart className="h-4 w-4" />
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Package2 className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Swords className="h-6 w-6" />
                  <span className="">LudoLeague</span>
                </Link>
                <NavLink href="/admin/dashboard">
                  <Home className="h-5 w-5" />
                  Dashboard
                </NavLink>
                 <NavLink href="/admin/matches">
                  <Package className="h-5 w-5" />
                  Matches
                </NavLink>
                <NavLink href="/admin/users">
                  <Users className="h-5 w-5" />
                  Users
                </NavLink>
                <NavLink href="/admin/deposits">
                    <Wallet className="h-5 w-5" />
                    Deposits
                </NavLink>
                <NavLink href="/admin/settings">
                  <LineChart className="h-5 w-5" />
                  Settings
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            {/* Add search bar here if needed */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
