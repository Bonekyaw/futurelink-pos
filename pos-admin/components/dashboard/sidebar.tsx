"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ChefHat,
  LayoutGrid,
  LayoutDashboard,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/dashboard/tables", label: "Tables", icon: LayoutGrid },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border/50">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <ChefHat className="size-5 text-white drop-shadow-md" />
        </div>
        <span className="text-xl font-black tracking-tight text-gradient">FutureLink</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "text-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl" />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className={cn(
                "size-5 shrink-0 transition-transform duration-300",
                isActive ? "text-primary scale-110" : "group-hover:scale-110"
              )} />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection indicator */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">POS Admin v0.1</p>
      </div>
    </aside>
  );
}
