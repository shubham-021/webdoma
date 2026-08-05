"use client";

import { PLAYERS } from "@/lib/constants";
import { buildPlayerURL } from "@/lib/players";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

interface PlayerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  customTemplate?: string;
  onCustomTemplateChange?: (value: string) => void;
}

export function PlayerSelector({
  value,
  onChange,
  customTemplate = "",
  onCustomTemplateChange,
}: PlayerSelectorProps) {
  const SERVER_LAUNCH_PLAYERS = ["mpv", "vlc", "iina"];

  const handleTest = async () => {
    // For mpv/vlc/iina: use server-side launch
    if (SERVER_LAUNCH_PLAYERS.includes(value)) {
      toast.info("Launching player...", {
        description: "The player will open in test mode to verify it works.",
      });

      try {
        const res = await fetch("http://localhost:9070/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player: value, url: "https://test-url.webdoma.local/test.mp4" }),
        });

        if (res.ok) {
          toast.success(`${value.toUpperCase()} launched via local daemon!`);
        } else {
          toast.error(`Failed to launch ${value}`, {
            description: "Aemond returned an error status.",
          });
        }
      } catch {
        toast.error("Network error", {
          description: "Ensure WebDoMa Aemond is running on port 9070 on your machine.",
        });
      }
      return;
    }

    // For protocol-handler players: use client-side approach
    const testURL = "https://test-url.webdoma.local/test.mp4";
    const playerURL = buildPlayerURL(value, testURL, customTemplate);

    const link = document.createElement("a");
    link.href = playerURL;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info("Opening player...", {
      description: "If your player didn't open, the protocol handler may not be registered on your system.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Media Player</CardTitle>
        <CardDescription>
          Choose which player opens when you click &quot;Stream&quot;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLAYERS.map((player) => (
            <button
              key={player.id}
              onClick={() => onChange(player.id)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 text-left ${
                value === player.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="font-medium text-foreground">{player.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {player.platforms.join(", ")}
              </div>
            </button>
          ))}
        </div>

        {value === "custom" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom URL template
            </label>
            <Input
              placeholder="protocol://{url}"
              value={customTemplate}
              onChange={(e) => onCustomTemplateChange?.(e.target.value)}
              id="custom-player-template"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="text-primary">{"{url}"}</code> as a placeholder for the stream URL
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          className="gap-2"
          id="test-player"
        >
          <ExternalLink size={14} />
          Test player
        </Button>
      </CardContent>
    </Card>
  );
}
