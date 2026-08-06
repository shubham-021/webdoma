"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, Settings, LogOut, Loader2, Users, ChevronLeft, ChevronRight, TextAlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    { href: "/accounts", label: "Accounts", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Prevent layout shift during SSR
  if (!isMounted) {
    return (
      <aside className="w-16 lg:w-56 h-full flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm shrink-0 z-20 relative">
        <div className="p-3 lg:p-4 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary-foreground">D</span>
          </div>
        </div>
      </aside>
    );
  }

  const renderContent = (isMobile: boolean) => {
    const showContent = !isCollapsed || isMobile;
    const collapsedStyle = isMobile;

    return (
      <>
        {/* Toggle Button (Desktop only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-6 h-6 w-6 rounded-full shadow-sm bg-gray-600/20 hover:bg-accent z-10 flex items-center justify-center"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <TextAlignJustify className="size-14" />
          </Button>
        )}

        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={isMobile ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col h-full shrink-0 ${isMobile ? 'w-16' : 'w-56'} overflow-hidden`}
            >
              {/* Logo */}
              <div className={`p-3 lg:p-4 flex items-center ${collapsedStyle ? 'justify-center' : 'gap-3'} overflow-hidden`}>
                <div className="w-9 h-9 rounded-lg bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">D</span>
                </div>
                {!collapsedStyle && (
                  <div className="whitespace-nowrap">
                    <h1 className="text-base font-bold tracking-tight">DoMa</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Web
                    </p>
                  </div>
                )}
              </div>

              <Separator className="opacity-50" />

              {/* Navigation */}
              <nav className="flex-1 p-2 space-y-1 overflow-hidden">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            } ${collapsedStyle ? 'justify-center px-0' : ''}`}
                          id={`nav-${item.label.toLowerCase()}`}
                        >
                          <item.icon size={18} className="shrink-0" />
                          {!collapsedStyle && (
                            <span className="whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {collapsedStyle && (
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </nav>

              <Separator className="opacity-50" />

              {/* Bottom actions */}
              <div className="p-2 space-y-1 overflow-hidden">
                <div className={`flex items-center px-1 ${collapsedStyle ? 'justify-center' : 'justify-start'}`}>
                  <ThemeToggle />
                </div>

                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${collapsedStyle ? 'justify-center px-0' : 'justify-start'}`}
                      id="sidebar-logout"
                    >
                      {isLoggingOut ? (
                        <Loader2 size={18} className="animate-spin shrink-0" />
                      ) : (
                        <LogOut size={18} className="shrink-0" />
                      )}
                      {!collapsedStyle && (
                        <span className="whitespace-nowrap ml-2">
                          Logout
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsedStyle && (
                    <TooltipContent side="right">
                      Logout
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Animated with Motion) */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 24 : 224 }}
        className="hidden lg:flex h-full flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm shrink-0 relative z-20"
        style={{ overflow: "visible" }}
      >
        {renderContent(false)}
      </motion.aside>

      {/* Mobile Sidebar (Static width 64px) */}
      <aside className="lg:hidden w-16 h-full flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm shrink-0 z-20 relative">
        {renderContent(true)}
      </aside>
    </>
  );
}
