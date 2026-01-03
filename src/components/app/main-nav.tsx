"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Lobby",
      active: pathname === "/dashboard",
    },
    {
      href: "/tournaments",
      label: "Tournaments",
      active: pathname.startsWith("/tournaments"),
    },
    {
      href: "/wallet",
      label: "Wallet",
      active: pathname === "/wallet",
    },
    {
      href: "/kyc",
      label: "KYC",
      active: pathname === "/kyc",
    },
    {
      href: "/admin/dashboard",
      label: "Admin",
      active: pathname.startsWith("/admin"),
    },
  ]

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white font-semibold"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
