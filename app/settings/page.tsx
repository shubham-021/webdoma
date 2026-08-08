"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { PlayerSelector } from "@/components/player-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, Info, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

export default function SettingsPage() {
  const router = useRouter();
  const [playerProtocol, setPlayerProtocol] = useState("vlc");
  const [customTemplate, setCustomTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [envData, setEnvData] = useState({ TMDB_API_KEY: "", SESSION_SECRET: "", TB_SB_ANON_KEY: "" });
  const [syncplayData, setSyncplayData] = useState({ SYNCPLAY_HOST: "", SYNCPLAY_ROOM: "", SYNCPLAY_USER: "", SYNCPLAY_PASS: "" });
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // States to keep track of the initial loaded configurations to detect changes
  const [initialPlayerProtocol, setInitialPlayerProtocol] = useState("vlc");
  const [initialCustomTemplate, setInitialCustomTemplate] = useState("");
  const [initialEnvData, setInitialEnvData] = useState({ TMDB_API_KEY: "", SESSION_SECRET: "", TB_SB_ANON_KEY: "" });
  const [initialSyncplayData, setInitialSyncplayData] = useState({ SYNCPLAY_HOST: "", SYNCPLAY_ROOM: "", SYNCPLAY_USER: "", SYNCPLAY_PASS: "" });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("relay-player-protocol");
    const savedTemplate = localStorage.getItem("relay-custom-template");
    if (saved) {
      setPlayerProtocol(saved);
      setInitialPlayerProtocol(saved);
    }
    if (savedTemplate) {
      setCustomTemplate(savedTemplate);
      setInitialCustomTemplate(savedTemplate);
    }
  }, []);

  // Fetch from server configs
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch("/api/settings/config");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const env = data.env || { TMDB_API_KEY: "", SESSION_SECRET: "", TB_SB_ANON_KEY: "" };
            const syncplay = data.syncplay || { SYNCPLAY_HOST: "", SYNCPLAY_ROOM: "", SYNCPLAY_USER: "", SYNCPLAY_PASS: "" };
            setEnvData(env);
            setInitialEnvData(env);
            setSyncplayData(syncplay);
            setInitialSyncplayData(syncplay);
          }
        }
      } catch (err) {
        toast.error("Failed to load configs");
      } finally {
        setIsLoadingConfigs(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for fast client-side access
      localStorage.setItem("relay-player-protocol", playerProtocol);
      if (customTemplate) {
        localStorage.setItem("relay-custom-template", customTemplate);
      }

      // Also persist to session cookie for server-side access
      await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerProtocol }),
      });

      // Persist env and syncplay configs
      const configRes = await fetch("/api/settings/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: envData, syncplay: syncplayData }),
      });

      if (!configRes.ok) throw new Error("Failed to save backend config");

      // Update initial values to current ones since we saved successfully
      setInitialPlayerProtocol(playerProtocol);
      setInitialCustomTemplate(customTemplate);
      setInitialEnvData(envData);
      setInitialSyncplayData(syncplayData);

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

  const hasChanges =
    playerProtocol !== initialPlayerProtocol ||
    customTemplate !== initialCustomTemplate ||
    envData.TMDB_API_KEY !== initialEnvData.TMDB_API_KEY ||
    envData.SESSION_SECRET !== initialEnvData.SESSION_SECRET ||
    envData.TB_SB_ANON_KEY !== initialEnvData.TB_SB_ANON_KEY ||
    syncplayData.SYNCPLAY_HOST !== initialSyncplayData.SYNCPLAY_HOST ||
    syncplayData.SYNCPLAY_ROOM !== initialSyncplayData.SYNCPLAY_ROOM ||
    syncplayData.SYNCPLAY_USER !== initialSyncplayData.SYNCPLAY_USER ||
    syncplayData.SYNCPLAY_PASS !== initialSyncplayData.SYNCPLAY_PASS;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure your Relay preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoadingConfigs || !hasChanges} className="gap-2" id="save-settings-header">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>

          <Separator />

          {/* Player Configuration */}
          <PlayerSelector
            value={playerProtocol}
            onChange={setPlayerProtocol}
            customTemplate={customTemplate}
            onCustomTemplateChange={setCustomTemplate}
          />



          <Separator />

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Environment Variables</CardTitle>
              <CardDescription>
                Configure secret keys used by the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingConfigs ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TMDB API Key</label>
                    <PasswordInput
                      value={envData.TMDB_API_KEY}
                      onChange={(e) => setEnvData({ ...envData, TMDB_API_KEY: e.target.value })}
                      placeholder="Enter TMDB API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Secret</label>
                    <PasswordInput
                      value={envData.SESSION_SECRET}
                      onChange={(e) => setEnvData({ ...envData, SESSION_SECRET: e.target.value })}
                      placeholder="Minimum 32 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TorBox SB Anon Key</label>
                    <PasswordInput
                      value={envData.TB_SB_ANON_KEY}
                      onChange={(e) => setEnvData({ ...envData, TB_SB_ANON_KEY: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Syncplay Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Syncplay Configuration</CardTitle>
              <CardDescription>
                Configure connection to your Syncplay server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingConfigs ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Host</label>
                    <Input
                      value={syncplayData.SYNCPLAY_HOST}
                      onChange={(e) => setSyncplayData({ ...syncplayData, SYNCPLAY_HOST: e.target.value })}
                      placeholder="e.g. 100.64.1.69:8969"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room</label>
                    <Input
                      value={syncplayData.SYNCPLAY_ROOM}
                      onChange={(e) => setSyncplayData({ ...syncplayData, SYNCPLAY_ROOM: e.target.value })}
                      placeholder="e.g. movie_nights"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      value={syncplayData.SYNCPLAY_USER}
                      onChange={(e) => setSyncplayData({ ...syncplayData, SYNCPLAY_USER: e.target.value })}
                      placeholder="Your Syncplay username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <PasswordInput
                      value={syncplayData.SYNCPLAY_PASS}
                      onChange={(e) => setSyncplayData({ ...syncplayData, SYNCPLAY_PASS: e.target.value })}
                      placeholder="Optional room password"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || isLoadingConfigs || !hasChanges} className="gap-2" id="save-settings">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div> */}

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
                <strong className="text-foreground">Relay</strong> — Self-hosted TorBox file manager
              </p>
              <p>
                Browse, stream, and download files from your TorBox cloud storage directly.
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
