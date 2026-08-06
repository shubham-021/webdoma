"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddAccountForm } from "@/components/add-account-form";
import { toast } from "sonner";
import { Loader2, PlusCircle, RefreshCw, Trash2, User } from "lucide-react";
import type { TorBoxAccount } from "@/lib/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TorBoxAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
      }
    } catch {
      toast.error("Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

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
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to sync account");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm("Are you sure you want to delete this account? Your downloaded media metadata for this account will be removed.")) return;
    
    setIsDeleting(accountId);
    try {
      const res = await fetch(`/api/accounts?account_id=${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddSuccess = () => {
    setIsAddAccountOpen(false);
    fetchAccounts();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Account Manager</h1>
              <p className="text-muted-foreground mt-1">
                Manage your TorBox accounts
              </p>
            </div>
            <Button onClick={() => setIsAddAccountOpen(true)} className="gap-2">
              <PlusCircle size={16} /> Add Account
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <User className="h-12 w-12 mb-4 opacity-20" />
                  <p>No TorBox accounts found.</p>
                  <p className="text-sm mt-1">Add an account to start syncing media.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-semibold">{account.torbox_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Last synced: {account.last_synced_at ? new Date(account.last_synced_at + 'Z').toLocaleString() : "Never"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncAccount(account.id)}
                          disabled={isSyncing !== null}
                          className="gap-2"
                        >
                          {isSyncing === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Sync
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={isDeleting !== null || isSyncing !== null}
                          className="gap-2"
                        >
                          {isDeleting === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <AddAccountForm 
          open={isAddAccountOpen} 
          onOpenChange={setIsAddAccountOpen} 
          onSuccess={handleAddSuccess} 
        />
      </main>
    </div>
  );
}
