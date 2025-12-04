
'use client'

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
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Users,
  Wallet,
  Swords,
  Shield,
  LogOut,
  FileCheck,
  CreditCard,
  ShieldAlert,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDoc, useUser } from "@/firebase";

type UserProfile = {
  id: string;
  role: 'superadmin' | 'deposit_admin' | 'match_admin' | 'user';
}

const allNavItems = [
  { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard", roles: ['superadmin', 'deposit_admin', 'match_admin'] },
  { href: "/admin/users", icon: Users, label: "Users", roles: ['superadmin'] },
  { href: "/admin/manage-admins", icon: ShieldAlert, label: "Manage Admins", roles: ['superadmin'] },
  { href: "/admin/deposits", icon: Wallet, label: "Deposits", roles: ['superadmin', 'deposit_admin'] },
  { href: "/admin/withdrawals", icon: CreditCard, label: "Withdrawals", roles: ['superadmin', 'deposit_admin'] },
  { href: "/admin/matches", icon: Swords, label: "Matches", roles: ['superadmin', 'match_admin'] },
  { href: "/admin/results", icon: FileCheck, label: "Results Verification", roles: ['superadmin', 'match_admin'] },
  { href: "/admin/settings", icon: Settings, label: "Site Settings", roles: ['superadmin'] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { data: userProfile, loading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

  const navItems = userProfile ? allNavItems.filter(item => item.roles.includes(userProfile.role)) : [];

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
            {loading ? (
                <>
                 <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                 <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                 <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                 <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                </>
            ) : navItems.map((item) => (
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
