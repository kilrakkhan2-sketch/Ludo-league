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
  Wallet,
  Trophy,
  PlusCircle,
  ShieldCheck,
  User,
  LogOut,
  Swords,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "../ui/input";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/create-match", icon: PlusCircle, label: "Create Match" },
  { href: "/tournaments", icon: Trophy, label: "Tournaments" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/kyc", icon: ShieldCheck, label: "KYC Verification" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="bg-card">
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Swords className="text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-headline text-primary">
                LudoLeague
              </h1>
            </Link>
          </SidebarHeader>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="justify-start w-full gap-2 p-2 h-auto"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://picsum.photos/seed/user-avatar/100/100"
                    data-ai-hint="person portrait"
                  />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden">
                  <p className="font-medium truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">
                    john.doe@email.com
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@email.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-card border-b md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <div className="relative w-full max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
