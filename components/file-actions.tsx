"use client";

import { Copy, Play, Download, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { buildPlayerURL } from "@/lib/players";

interface FileActionsProps {
  torrentId: number;
  fileId: number;
  fileName: string;
  isMedia: boolean;
  playerProtocol: string;
  accountId: number;
}

// Players that support local client-side daemon launch (Aemond)
const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

export function FileActions({
  torrentId,
  fileId,
  fileName,
  isMedia,
  playerProtocol,
  accountId,
}: FileActionsProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSyncplaying, setIsSyncplaying] = useState(false);

  const getCdnLink = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/cdn-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          torrent_id: torrentId,
          file_id: fileId,
          account_id: accountId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error || "Failed to get CDN link");
        return null;
      }

      const data = await res.json();
      return data.url;
    } catch {
      toast.error("Network error");
      return null;
    }
  }, [torrentId, fileId, accountId]);

  const handleCopyLink = useCallback(async () => {
    setIsCopying(true);
    try {
      const cdnUrl = await getCdnLink();
      if (!cdnUrl) return;

      await navigator.clipboard.writeText(cdnUrl);
      toast.success("CDN link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setIsCopying(false);
    }
  }, [getCdnLink]);

  const handleSyncplay = useCallback(async () => {
    if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) {
      toast.error("Syncplay requires a local daemon player (mpv, vlc, iina)");
      return;
    }
    setIsSyncplaying(true);
    try {
      const cdnUrl = await getCdnLink();
      if (!cdnUrl) return;

      try {
        const daemonRes = await fetch("http://localhost:9070/syncplay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player: playerProtocol, url: cdnUrl }),
        });

        if (daemonRes.ok) {
          const data = await daemonRes.json();
          toast.success(`Syncplay launched via ${playerProtocol.toUpperCase()}`, {
            description: `Joined room: ${data.room || "unknown"}`,
          });
          return;
        }
        const errData = await daemonRes.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || "Daemon returned error status");
      } catch (e: any) {
        toast.error("Syncplay launch failed", {
          description: e.message || "Ensure Aemond is running and syncplay.conf is configured.",
        });
      }
    } catch {
      toast.error("Failed to start Syncplay");
    } finally {
      setIsSyncplaying(false);
    }
  }, [getCdnLink, playerProtocol]);

  const handleStream = useCallback(async () => {
    setIsStreaming(true);
    try {
      const cdnUrl = await getCdnLink();
      if (!cdnUrl) return;

      if (LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) {
        // Send CDN URL directly to Aemond daemon
        try {
          const daemonRes = await fetch("http://localhost:9070/play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player: playerProtocol, url: cdnUrl }),
          });

          if (daemonRes.ok) {
            toast.success(`Launched ${playerProtocol.toUpperCase()} via Local Daemon`, {
              description: "CDN stream active",
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

      // Protocol handler path (potplayer, infuse, etc.)
      const playerURL = buildPlayerURL(playerProtocol, cdnUrl);

      const link = document.createElement("a");
      link.href = playerURL;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Opening in ${playerProtocol.toUpperCase()}`, {
        description: "CDN stream active",
      });
    } catch {
      toast.error("Failed to open stream");
    } finally {
      setIsStreaming(false);
    }
  }, [getCdnLink, playerProtocol]);

  const handleDownload = useCallback(async () => {
    const cdnUrl = await getCdnLink();
    if (!cdnUrl) return;
    window.open(cdnUrl, "_blank");
    toast.success("Download started", { description: fileName });
  }, [getCdnLink, fileName]);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
            disabled={isCopying}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            id={`copy-link-${fileName}`}
          >
            {isCopying ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Copy size={16} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy CDN link</TooltipContent>
      </Tooltip>

      {isMedia && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStream();
                }}
                disabled={isStreaming}
                className="h-8 w-8 hover:bg-violet-500/10 hover:text-violet-400"
                id={`stream-${fileName}`}
              >
                {isStreaming ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Play size={16} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stream in player</TooltipContent>
          </Tooltip>

          {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncplay();
                  }}
                  disabled={isSyncplaying}
                  className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-400"
                  id={`syncplay-${fileName}`}
                >
                  {isSyncplaying ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Users size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Syncplay with friends</TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-400"
            id={`download-${fileName}`}
          >
            <Download size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download file</TooltipContent>
      </Tooltip>
    </div>
  );
}