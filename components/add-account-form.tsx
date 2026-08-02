"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addAccountSchema = z.object({
  webdav_username: z.string().min(1, "TorBox email or 'torbox' is required"),
  webdav_password: z.string().min(1, "API Key is required"),
  display_name: z.string().optional(),
});

interface AddAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account?: any) => void;
}

export function AddAccountForm({ open, onOpenChange, onSuccess }: AddAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [webdavUsername, setWebdavUsername] = useState("");
  const [webdavPassword, setWebdavPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const body = {
        webdav_username: webdavUsername,
        webdav_password: webdavPassword,
        display_name: displayName || undefined,
      };

      const parsed = addAccountSchema.safeParse(body);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add account");
        return;
      }

      toast.success("TorBox account added & synced successfully!");
      setWebdavUsername("");
      setWebdavPassword("");
      setDisplayName("");
      onOpenChange(false);
      if (onSuccess) onSuccess(data.account);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border border-border/50 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 border-b border-border/50 bg-card">
            <DialogTitle className="text-lg font-semibold">Add TorBox Account</DialogTitle>
            <CardDescription className="text-sm mt-1">
              Enter your TorBox WebDAV credentials. Find your API key at{" "}
              <a
                href="https://torbox.app/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                torbox.app/settings
              </a>
            </CardDescription>
          </DialogHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="webdav-username" className="text-sm font-medium">
                WebDAV Username (Email)
              </label>
              <Input
                id="webdav-username"
                type="text"
                placeholder="your@email.com or 'torbox'"
                value={webdavUsername}
                onChange={(e) => setWebdavUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="webdav-password" className="text-sm font-medium">
                WebDAV Password (API Key)
              </label>
              <Input
                id="webdav-password"
                type="password"
                placeholder="Paste your TorBox API key"
                value={webdavPassword}
                onChange={(e) => setWebdavPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                Display Name (optional)
              </label>
              <Input
                id="display-name"
                type="text"
                placeholder="e.g. Personal, Work, Family"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Adding & Syncing Remote...
                </>
              ) : (
                <>
                  <Key className="mr-2" size={18} />
                  Add TorBox Account
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </DialogContent>
    </Dialog>
  );
}