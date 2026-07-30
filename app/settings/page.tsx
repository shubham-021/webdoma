"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { PlayerSelector } from "@/components/player-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LogOut, Info, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [playerProtocol, setPlayerProtocol] = useState("vlc");
  const [customTemplate, setCustomTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("doma-player-protocol");
    const savedTemplate = localStorage.getItem("doma-custom-template");
    if (saved) setPlayerProtocol(saved);
    if (savedTemplate) setCustomTemplate(savedTemplate);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for fast client-side access
      localStorage.setItem("doma-player-protocol", playerProtocol);
      if (customTemplate) {
        localStorage.setItem("doma-custom-template", customTemplate);
      }

      // Also persist to session cookie for server-side access
      await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerProtocol }),
      });

      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your DoMa Web preferences
            </p>
          </div>

          <Separator />

          {/* Player Configuration */}
          <PlayerSelector
            value={playerProtocol}
            onChange={setPlayerProtocol}
            customTemplate={customTemplate}
            onCustomTemplateChange={setCustomTemplate}
          />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2" id="save-settings">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Saving..." : "Save preferences"}
            </Button>
          </div>

          <Separator />

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>
                Manage your TorBox connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="gap-2"
                id="settings-logout"
              >
                <LogOut size={16} />
                Disconnect &amp; Logout
              </Button>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info size={18} />
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong className="text-foreground">DoMa Web</strong> — Self-hosted TorBox file manager
              </p>
              <p>
                Browse, stream, and download files from your TorBox cloud storage via WebDAV.
              </p>
              <p className="text-xs">
                Credentials are stored in an encrypted cookie and never leave your server.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
