"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addAccountSchema = z.object({
  torbox_email: z.string().min(1, "TorBox email is required"),
  torbox_password: z.string().min(1, "TorBox password is required"),
});

interface AddAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account?: any) => void;
}

export function AddAccountForm({ open, onOpenChange, onSuccess }: AddAccountFormProps) {
  const { isAddingAccount, setIsAddingAccount, userSettings } = useFileStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [torboxEmail, setTorboxEmail] = useState("");
  const [torboxPassword, setTorboxPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!userSettings?.tmdb_api_key) {
      setError("TMDB API Key is missing. Please configure it in User Settings first.");
      return;
    }

    setIsAddingAccount(true);

    try {
      const body = {
        torbox_email: torboxEmail,
        torbox_password: torboxPassword,
      };

      const parsed = addAccountSchema.safeParse(body);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        setIsAddingAccount(false);
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
      setTorboxEmail("");
      setTorboxPassword("");
      onOpenChange(false);
      if (onSuccess) onSuccess(data.account);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsAddingAccount(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 p-0 overflow-hidden bg-card border border-border/50 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 border-b border-border/50 bg-card">
            <DialogTitle className="text-lg font-semibold">Add TorBox Account</DialogTitle>
            <CardDescription className="text-sm mt-1">
              Enter your TorBox account credentials. These will be securely encrypted.
            </CardDescription>
          </DialogHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="torbox-email" className="text-sm font-medium">
                TorBox Email
              </label>
              <Input
                id="torbox-email"
                type="text"
                placeholder="your@email.com"
                value={torboxEmail}
                onChange={(e) => setTorboxEmail(e.target.value)}
                disabled={isAddingAccount}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="torbox-password" className="text-sm font-medium">
                TorBox Password
              </label>
              <div className="relative">
                <Input
                  id="torbox-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your TorBox password"
                  value={torboxPassword}
                  onChange={(e) => setTorboxPassword(e.target.value)}
                  disabled={isAddingAccount}
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>


            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isAddingAccount}
            >
              {isAddingAccount ? (
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