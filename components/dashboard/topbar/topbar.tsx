"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, CheckCircle, Menu, User, Plug } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "../command/command-palette";
import { TasksPanel } from "@/components/dashboard/topbar/tasks-panel";
import { NotificationsPanel } from "@/components/dashboard/topbar/notifications-panel";
import { useSidebar } from "@/components/dashboard/sidebar/sidebar-context";
import { ThemeToggle } from "@/components/dashboard/topbar/theme-toggle";
import { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { signOut, user } = useClerk();
  const router = useRouter();
  const { toggleMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [openTaskCount, setOpenTaskCount] = useState(0);

  const refreshTasksCount = useCallback(async () => {
    try {
      const [tasksRes, wiRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/work-items?my_items=true", { cache: "no-store" }),
      ]);

      let taskCount = 0;
      if (tasksRes.ok) {
        const payload = await tasksRes.json().catch(() => null);
        const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
        taskCount = tasks.filter((task: { is_completed?: boolean; status?: string }) => {
          if (typeof task.is_completed === "boolean") return !task.is_completed;
          return task.status !== "Done";
        }).length;
      }

      let wiCount = 0;
      if (wiRes.ok) {
        const wiPayload = await wiRes.json().catch(() => null);
        const items = Array.isArray(wiPayload?.work_items) ? wiPayload.work_items : [];
        wiCount = items.filter((wi: { status?: string }) => wi.status !== "done").length;
      }

      setOpenTaskCount(taskCount + wiCount);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshTasksCount();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [refreshTasksCount]);

  const handleTasksOpenChange = (nextOpen: boolean) => {
    setTasksOpen(nextOpen);
    if (!nextOpen) {
      void refreshTasksCount();
    }
  };

  const handleTasksChanged = useCallback(() => {
    void refreshTasksCount();
    router.refresh();
  }, [refreshTasksCount, router]);

  return (
    <>
      <header className="flex items-center h-14 ml-1 mr-3 mt-3 mb-1 px-5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm">
        {/* ---- Left: Hamburger (mobile) + Logo + Dashboard ---- */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          {/* Hamburger — visible below lg */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden shrink-0"
            onClick={toggleMobile}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo + Dashboard text */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-small.jpg" alt="Neosparkx" width={28} height={28} className="rounded-lg object-cover" />
            <span className="font-semibold text-sm text-foreground hidden sm:inline">Dashboard</span>
          </Link>
        </div>

        {/* ---- Center: Search ---- */}
        <div className="flex-1 flex justify-center px-4">
          <Button
            variant="outline"
            className="hidden md:flex h-8 w-full max-w-xs justify-between text-muted-foreground hover:text-foreground rounded-lg text-xs border-border bg-transparent"
            onClick={() => setCommandOpen(true)}
          >
            <span className="flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* ---- Right: Actions (spaced out) ---- */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search icon — mobile only */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Integrations */}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex" asChild>
            <Link href="/dashboard/integrations">
              <Plug className="h-4 w-4" />
            </Link>
          </Button>

          {/* Tasks */}
          <Button
            size="icon"
            variant="ghost"
            className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground relative"
            onClick={() => {
              void refreshTasksCount();
              setTasksOpen(true);
            }}
          >
            <CheckCircle className="h-4 w-4" />
            {openTaskCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-[9px] leading-4 text-white text-center font-medium">
                {openTaskCount > 9 ? "9+" : openTaskCount}
              </span>
            ) : null}
          </Button>

          {/* Theme Toggle */}
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="hidden sm:flex">
            <NotificationsPanel />
          </div>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full ml-0.5 overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.firstName ?? "User"}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user && <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>}
                  {user && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-accent focus:bg-accent" onClick={() => router.push("/dashboard/settings")}>My Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent focus:bg-accent" onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent focus:bg-accent lg:hidden" onClick={() => router.push("/dashboard/integrations")}>Integrations</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                onClick={() => signOut({ redirectUrl: '/login' })}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <TasksPanel open={tasksOpen} onOpenChange={handleTasksOpenChange} onTasksChanged={handleTasksChanged} />
    </>
  );
}
