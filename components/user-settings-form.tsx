"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useFileStore } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

export function UserSettingsForm() {
  const { userSettings, fetchUserSettings } = useFileStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UserSettings>({
    tmdb_api_key: "",
    syncplay_host: "",
    syncplay_room: "",
    syncplay_user: "",
    syncplay_pass: "",
  });
  
  const [showTmdbKey, setShowTmdbKey] = useState(false);
  const [showSyncplayPass, setShowSyncplayPass] = useState(false);

  // Compute if form is dirty
  const isDirty = userSettings
    ? formData.tmdb_api_key !== (userSettings.tmdb_api_key || "") ||
      formData.syncplay_host !== (userSettings.syncplay_host || "") ||
      formData.syncplay_room !== (userSettings.syncplay_room || "") ||
      formData.syncplay_user !== (userSettings.syncplay_user || "") ||
      formData.syncplay_pass !== (userSettings.syncplay_pass || "")
    : false;

  useEffect(() => {
    fetchUserSettings();
  }, [fetchUserSettings]);

  useEffect(() => {
    if (userSettings) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setFormData({
        tmdb_api_key: userSettings.tmdb_api_key || "",
        syncplay_host: userSettings.syncplay_host || "",
        syncplay_room: userSettings.syncplay_room || "",
        syncplay_user: userSettings.syncplay_user || "",
        syncplay_pass: userSettings.syncplay_pass || "",
      });
    }
  }, [userSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully");
      fetchUserSettings(); // refresh store
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
        <CardDescription>Configure your personal API keys and Syncplay details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">TMDB Configuration</h3>
            <div className="space-y-2 flex flex-col">
              <label htmlFor="tmdb_api_key" className="text-sm font-medium">TMDB API Key</label>
              <div className="relative">
                <Input
                  id="tmdb_api_key"
                  name="tmdb_api_key"
                  type={showTmdbKey ? "text" : "password"}
                  placeholder="Enter your TMDB Read Access Token or API Key"
                  value={formData.tmdb_api_key}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowTmdbKey(!showTmdbKey)}
                  className="absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden"
                >
                  {showTmdbKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Syncplay Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <label htmlFor="syncplay_host" className="text-sm font-medium">Host (Domain/IP + Port)</label>
                <Input
                  id="syncplay_host"
                  name="syncplay_host"
                  placeholder="syncplay.example.com:8999"
                  value={formData.syncplay_host}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <label htmlFor="syncplay_room" className="text-sm font-medium">Room Name</label>
                <Input
                  id="syncplay_room"
                  name="syncplay_room"
                  placeholder="My Movie Room"
                  value={formData.syncplay_room}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <label htmlFor="syncplay_user" className="text-sm font-medium">Username</label>
                <Input
                  id="syncplay_user"
                  name="syncplay_user"
                  placeholder="PlayerOne"
                  value={formData.syncplay_user}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <label htmlFor="syncplay_pass" className="text-sm font-medium">Server Password (Optional)</label>
                <div className="relative">
                  <Input
                    id="syncplay_pass"
                    name="syncplay_pass"
                    type={showSyncplayPass ? "text" : "password"}
                    placeholder="Leave blank if none"
                    value={formData.syncplay_pass}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSyncplayPass(!showSyncplayPass)}
                    className="absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden"
                  >
                    {showSyncplayPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !isDirty} className="gap-2 cursor-pointer">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
