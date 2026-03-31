"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  FileText,
  CreditCard,
  PieChart,
  ScrollText,
  Briefcase,
  Plug,
  Settings,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/dashboard/topbar/theme-toggle";
import { NotificationsPanel } from "@/components/dashboard/topbar/notifications-panel";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: string;
};

type NavGroup = {
  name: string;
  items: NavItem[];
};

const overviewItem: NavItem = { name: "Overview", href: "/dashboard", icon: LayoutDashboard };
const navigationGroups: NavGroup[] = [
  {
    name: "Campaign",
    items: [
      { name: "Applications", href: "/dashboard/applications", icon: ClipboardList, badgeKey: "pendingApplications" },
    ],
  },
  {
    name: "Workspace",
    items: [
      { name: "Clients", href: "/dashboard/clients", icon: Users },
      { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
      { name: "My Work", href: "/dashboard/my-work", icon: Briefcase },
      { name: "Meetings", href: "/dashboard/meetings", icon: Calendar },
    ],
  },
  {
    name: "Finance",
    items: [
      { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    ],
  },
  {
    name: "Documents",
    items: [
      { name: "Contracts & Agreements", href: "/dashboard/contracts", icon: ScrollText },
      { name: "Files", href: "/dashboard/files", icon: FileText },
    ],
  },
  {
    name: "Reports",
    items: [{ name: "Analytics", href: "/dashboard/analytics", icon: PieChart }],
  },
];

/* ------------------------------------------------------------------ */
/*  Icon rail item with tooltip                                       */
/* ------------------------------------------------------------------ */

function IconRailItem({ item, isActive, badgeCount }: { item: NavItem; isActive: boolean; badgeCount?: number }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
            isActive
              ? "bg-primary/15 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {(badgeCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {badgeCount}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop: Floating icon-only sidebar                               */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const pathname = usePathname();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  // Fetch pending application count for the badge
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/campaign-applications?status=pending");
        if (res.ok) {
          const data = await res.json();
          setBadgeCounts((prev) => ({
            ...prev,
            pendingApplications: data.applications?.length ?? 0,
          }));
        }
      } catch {
        // Silently fail — badge just won't show
      }
    }
    fetchPendingCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <div className="hidden lg:flex flex-col items-center justify-center h-full w-[60px] shrink-0 py-4 pl-3">
        {/* Floating pill container — vertically centered */}
        <div className="flex flex-col items-center gap-0.5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl py-2 px-1.5 shadow-sm">
          {/* Overview */}
          <IconRailItem
            item={overviewItem}
            isActive={pathname === overviewItem.href}
          />

          {/* All nav groups */}
          {navigationGroups.map((group) => (
            <div key={group.name} className="w-full flex flex-col items-center gap-0.5">
              <div className="w-5 h-px bg-border/40 my-0.5" />
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <IconRailItem
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    badgeCount={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Pending badge for mobile sidebar                                   */
/* ------------------------------------------------------------------ */

function PendingBadgeMobile() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/campaign-applications?status=pending");
        if (res.ok) {
          const data = await res.json();
          setCount(data.applications?.length ?? 0);
        }
      } catch {
        // Silently fail
      }
    }
    fetchCount();
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
      {count}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile: Full drawer sidebar                                       */
/* ------------------------------------------------------------------ */

function MobileSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center px-6 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg hover:opacity-90 transition-opacity"
          onClick={onNavigate}
        >
          <Image src="/logo-small.jpg" alt="Neosparkx Logo" width={24} height={24} className="rounded-md object-cover" />
          <span>Neosparkx</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          <Link
            href={overviewItem.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-card",
              pathname === overviewItem.href
                ? "bg-card text-primary before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            {overviewItem.name}
          </Link>

          {navigationGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              <h4 className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.name}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "relative group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-card",
                        isActive
                          ? "bg-card text-primary before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "group-hover:text-foreground"
                        )}
                      />
                      {item.name}
                      {item.badgeKey === "pendingApplications" && (
                        <PendingBadgeMobile />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile-only bottom actions */}
      <div className="sm:hidden mt-auto border-t border-border p-4 flex items-center justify-between shrink-0">
        <Link href="/dashboard/integrations" onClick={onNavigate} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
          <Plug className="h-5 w-5" />
        </Link>
        <Link href="/dashboard/settings" onClick={onNavigate} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
          <Settings className="h-5 w-5" />
        </Link>
        <div className="scale-90 origin-left">
          <ThemeToggle />
        </div>
        <div className="scale-90 origin-right">
          <NotificationsPanel />
        </div>
      </div>
    </>
  );
}

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[260px] p-0 bg-background border-border flex flex-col"
      >
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <MobileSidebarContent onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
