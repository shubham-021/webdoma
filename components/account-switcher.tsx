"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, PlusCircle, User, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddAccountForm } from "@/components/add-account-form";
import { useFileStore } from "@/lib/store";
import type { TorBoxAccount } from "@/lib/types";

interface AccountSwitcherProps {
  accounts: TorBoxAccount[];
}

export function AccountSwitcher({ accounts }: AccountSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeAccountId = useFileStore((state) => state.activeAccountId);
  const setActiveAccountId = useFileStore((state) => state.setActiveAccountId);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<number | null>(null);

  // Sync activeAccountId from URL param to store initially or when it changes
  useEffect(() => {
    const accountIdParam = searchParams.get("account_id");
    if (accountIdParam) {
      const accountId = parseInt(accountIdParam, 10);
      if (storeAccountId !== accountId) {
        setActiveAccountId(accountId);
      }
    } else if (accounts.length > 0 && !storeAccountId) {
      // Default to first account
      setActiveAccountId(accounts[0].id);
    }
  }, [searchParams, accounts, storeAccountId, setActiveAccountId]);

  const currentAccountId = storeAccountId || accounts[0]?.id;
  const activeAccount = accounts.find((a) => a.id === currentAccountId) || accounts[0];

  const handleSwitchAccount = (accountId: number) => {
    if (accountId === currentAccountId) return;

    setActiveAccountId(accountId);

    // Update URL with account_id param
    const params = new URLSearchParams(searchParams.toString());
    params.set("account_id", accountId.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleSyncAccount = async (accountId: number) => {
    setIsSyncing(accountId);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      toast.success(`Synced ${data.files_synced} files`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to sync account");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleAddAccountSuccess = (newAccount?: any) => {
    setIsAddAccountOpen(false);
    if (newAccount?.id) {
      window.location.href = `/?account_id=${newAccount.id}`;
    } else {
      window.location.reload();
    }
  };

  // No accounts yet - show add button
  if (accounts.length === 0) {
    return (
      <div className="flex items-center">
        <AddAccountForm open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen} onSuccess={handleAddAccountSuccess} />
        <Button
          variant="outline"
          onClick={() => setIsAddAccountOpen(true)}
          className="w-auto gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add TorBox Account
        </Button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-50 justify-between bg-card hover:bg-card/80 border-border/50 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User size={12} className="text-primary" />
              </div>
              <span className="truncate text-sm">
                {activeAccount?.torbox_email}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 outline-none">
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onSelect={() => handleSwitchAccount(account.id)}
              className="flex items-center justify-between cursor-pointer"
              disabled={isSyncing !== null}
            >
              <div className="flex items-center gap-2 truncate flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${account.is_active ? "bg-green-100 dark:bg-green-950" : "bg-gray-100"
                  }`}>
                  <User size={12} className={account.is_active ? "text-green-600 dark:text-green-400" : "text-gray-400"} />
                </div>
                <span className="truncate">
                  {account.torbox_email}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isSyncing === account.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncAccount(account.id);
                    }}
                    disabled={isSyncing !== null}
                    title="Sync this account"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {account.id === currentAccountId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsAddAccountOpen(true)}
            className="cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
            disabled={isSyncing !== null}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add TorBox Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddAccountForm open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen} onSuccess={handleAddAccountSuccess} />
    </>
  );
}