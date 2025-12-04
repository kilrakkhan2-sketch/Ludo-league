import type { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Users,
  Wallet,
  Swords,
  Shield,
  LogOut,
  UserCircle,
  FileCheck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/deposits", icon: Wallet, label: "Deposits" },
  { href: "/admin/matches", icon: Swords, label: "Matches" },
  { href: "/admin/results", icon: FileCheck, label: "Results Verification" },
  { href: "/admin/withdrawals", icon: CreditCard, label: "Withdrawals" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="bg-card">
          <SidebarHeader>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-headline text-primary group-data-[collapsible=icon]:hidden">
                Admin Panel
              </h1>
            </Link>
          </SidebarHeader>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" className="w-full justify-start gap-2 p-2" asChild tooltip="Exit Admin Panel">
            <Link href="/dashboard">
                <LogOut className="rotate-180"/>
                <span className="group-data-[collapsible=icon]:hidden">Exit Admin Panel</span>
            </Link>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-card border-b">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 lg:p-6 bg-muted/40">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
