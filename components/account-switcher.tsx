"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, PlusCircle, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { useFileStore } from "@/lib/store";
import type { Account } from "@/lib/types";

interface AccountSwitcherProps {
  accounts: Account[];
  activeUsername?: string;
}

export function AccountSwitcher({ accounts, activeUsername }: AccountSwitcherProps) {
  const router = useRouter();
  const storeUsername = useFileStore((state) => state.activeUsername);
  const setActiveUsername = useFileStore((state) => state.setActiveUsername);
  
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  // Sync activeUsername from server prop to store initially or when it changes
  useEffect(() => {
    if (activeUsername && storeUsername !== activeUsername) {
      setActiveUsername(activeUsername);
    }
  }, [activeUsername, storeUsername, setActiveUsername]);

  const currentActiveUsername = storeUsername || activeUsername || accounts[0]?.username;
  const activeAccount = accounts.find((a) => a.username === currentActiveUsername) || accounts[0];

  const handleSwitchAccount = async (username: string) => {
    if (username === currentActiveUsername) return;

    setIsSwitching(username);
    try {
      const res = await fetch("/api/auth/switch-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        throw new Error("Failed to switch account");
      }

      toast.success(`Switched to ${username}`);
      
      // Update state in store (resets path to "/" and updates activeUsername)
      setActiveUsername(username);
      
      // Background sync server component state
      router.refresh();
      
    } catch (error) {
      toast.error("Failed to switch account");
    } finally {
      setIsSwitching(null);
    }
  };

  const handleAddAccountSuccess = (username: string) => {
    setIsAddAccountOpen(false);
    setActiveUsername(username);
    router.refresh();
  };

  if (!activeAccount) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[200px] justify-between bg-card hover:bg-card/80 border-border/50 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User size={12} className="text-primary" />
              </div>
              <span className="truncate text-sm">{activeAccount.username}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] outline-none">
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.username}
              onSelect={() => handleSwitchAccount(account.username)}
              className="flex items-center justify-between cursor-pointer"
              disabled={isSwitching !== null}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={12} className="text-primary/70" />
                </div>
                <span className="truncate">{account.username}</span>
              </div>
              {isSwitching === account.username ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                account.username === activeUsername && (
                  <Check className="h-4 w-4 text-primary" />
                )
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsAddAccountOpen(true)}
            className="cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
            disabled={isSwitching !== null}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-none shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <LoginForm onSuccess={handleAddAccountSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
