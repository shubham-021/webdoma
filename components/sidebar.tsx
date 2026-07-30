"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/", label: "Browse", icon: FolderOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-16 lg:w-56 h-full flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm shrink-0">
      {/* Logo */}
      <div className="p-3 lg:p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary-foreground">D</span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-base font-bold tracking-tight">DoMa</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Web
          </p>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  id={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon size={18} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="opacity-50" />

      {/* Bottom actions */}
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-center lg:justify-start px-1">
          <ThemeToggle />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-center lg:justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              id="sidebar-logout"
            >
              {isLoggingOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              <span className="hidden lg:inline ml-2">Logout</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
