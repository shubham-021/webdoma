"use client";

import { FileText, Play, Download, Copy, FolderOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { buildPlayerURL } from "@/lib/players";
import { Skeleton } from "@/components/ui/skeleton";

interface OtherFile {
  id: number;
  remote_path: string;
  filename: string;
  sizeFormatted: string;
  mime_type: string;
  last_modified: string;
}

interface OtherFilesViewProps {
  files: OtherFile[];
  isLoading: boolean;
  searchQuery: string;
  playerProtocol: string;
  activeAccountId: number | null;
}

export function OtherFilesView({ files, isLoading, searchQuery, playerProtocol, activeAccountId }: OtherFilesViewProps) {
  const filtered = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = async (remotePath: string) => {
    try {
      const res = await fetch("/api/auth/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: remotePath, account_id: activeAccountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "Failed to create token");

      const streamUrl = `${window.location.origin}/api/stream${remotePath}?token=${data.token}`;
      await navigator.clipboard.writeText(streamUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

  const handleStream = async (remotePath: string) => {
    try {
      if (LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) {
        // FAST DIRECT PATH: Fetch encrypted WebDAV URL for Aemond daemon
        const res = await fetch("/api/auth/direct-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: remotePath, account_id: activeAccountId }),
        });
        const data = await res.json();
        if (!res.ok || !data.cipher) throw new Error(data.error || "Failed to get stream cipher");

        try {
          const daemonRes = await fetch("http://localhost:9070/play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player: playerProtocol, cipher: data.cipher }),
          });

          if (daemonRes.ok) {
            toast.success(`Launched ${playerProtocol.toUpperCase()} via Local Daemon`, {
              description: "High-speed encrypted bypass active."
            });
            return;
          }
          throw new Error("Daemon returned error status");
        } catch (e: any) {
          toast.error("Local daemon connection failed", { 
            description: "Ensure WebDoMa Aemond is running on port 9070 on your machine." 
          });
          return;
        }
      }

      // SECURE PROXY PATH: For external protocol handlers (potplayer, infuse)
      const res = await fetch("/api/auth/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: remotePath, account_id: activeAccountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "Failed to create proxy token");

      const streamUrl = `${window.location.origin}/api/stream${remotePath}?token=${data.token}`;
      const playerUrl = buildPlayerURL(playerProtocol, streamUrl);
      
      const link = document.createElement("a");
      link.href = playerUrl;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Opening in ${playerProtocol.toUpperCase()}`, {
        description: "Standard proxy stream active."
      });
    } catch {
      toast.error("Failed to start stream");
    }
  };

  const handleDownload = (remotePath: string) => {
    const encodedPath = remotePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    window.open(`/api/download${encodedPath}?account_id=${activeAccountId}`, "_blank");
    toast.success("Download started");
  };

  const handleSyncplay = async (remotePath: string) => {
    if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) return;
    try {
      const res = await fetch("/api/auth/direct-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: remotePath, account_id: activeAccountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.cipher) throw new Error(data.error || "Failed to get stream cipher");

      const daemonRes = await fetch("http://localhost:9070/syncplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: playerProtocol, cipher: data.cipher }),
      });

      if (daemonRes.ok) {
        const resData = await daemonRes.json();
        toast.success(`Syncplay launched via ${playerProtocol.toUpperCase()}`, {
          description: `Joined room: ${resData.room || "unknown"}`,
        });
        return;
      }
      throw new Error("Daemon returned error");
    } catch (e: any) {
      toast.error("Syncplay launch failed", {
        description: e.message || "Ensure Aemond is running and syncplay.conf is configured.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FolderOpen size={48} className="text-muted-foreground/30 mb-2" />
        <p className="text-lg font-medium">No uncategorized files</p>
        <p className="text-sm">All indexed items have been parsed into Movies or TV Shows.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filtered.map((file) => (
        <Card
          key={file.id}
          className="p-3.5 flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/70 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground truncate">
                {file.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {file.sizeFormatted} • {file.mime_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={() => handleStream(file.remote_path)}
              className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Play size={13} className="fill-current" />
              Open
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleCopyLink(file.remote_path)}
              className="h-8 w-8 text-xs cursor-pointer"
              title="Copy Link"
            >
              <Copy size={13} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => handleDownload(file.remote_path)}
              className="h-8 w-8 text-xs cursor-pointer"
              title="Download File"
            >
              <Download size={13} />
            </Button>
            {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleSyncplay(file.remote_path)}
                className="h-8 w-8 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                title="Syncplay with friends"
              >
                <Users size={13} />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
