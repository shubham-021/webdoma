"use client";

import { Copy, Play, Download, Loader2, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { LOCAL_DAEMON_PLAYERS } from "@/lib/constants";
import { launchPlayback } from "@/lib/client-play";

interface FileActionsProps {
  torrentId: number;
  fileId: number;
  fileName: string;
  isMedia: boolean;
  playerProtocol: string;
  accountId: number;
  variant?: "default" | "dropdown";
}

export function FileActions({
  torrentId,
  fileId,
  fileName,
  isMedia,
  playerProtocol,
  accountId,
  variant = "default",
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
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncplay", player: playerProtocol, torrent_id: torrentId, file_id: fileId, account_id: accountId }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(`Syncplay launched via ${playerProtocol.toUpperCase()}`, {
          description: `Joined room: ${data.room || "unknown"}`,
        });
        return;
      }
      throw new Error(data.error || "Failed to launch syncplay");
    } catch (e: any) {
      toast.error("Syncplay launch failed", {
        description: e.message || "Ensure syncplay.conf is configured at the project root.",
      });
    } finally {
      setIsSyncplaying(false);
    }
  }, [torrentId, fileId, accountId, playerProtocol]);

  const handleStream = useCallback(async () => {
    setIsStreaming(true);
    try {
      await launchPlayback({ torrentId, fileId, accountId, playerProtocol });
    } finally {
      setIsStreaming(false);
    }
  }, [torrentId, fileId, accountId, playerProtocol]);

  const handleDownload = useCallback(async () => {
    const cdnUrl = await getCdnLink();
    if (!cdnUrl) return;
    window.open(cdnUrl, "_blank");
    toast.success("Download started", { description: fileName });
  }, [getCdnLink, fileName]);

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white focus:ring-0 focus:outline-none cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStream(); }} disabled={isStreaming} className="cursor-pointer gap-2">
            {isStreaming ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isMedia ? "Stream" : "Open"}</span>
          </DropdownMenuItem>

          {isMedia && LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSyncplay(); }} disabled={isSyncplaying} className="cursor-pointer gap-2 text-amber-500 focus:text-amber-400">
              {isSyncplaying ? <Loader2 className="animate-spin h-4 w-4" /> : <Users className="h-4 w-4" />}
              <span>Syncplay</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(); }} disabled={isCopying} className="cursor-pointer gap-2">
            {isCopying ? <Loader2 className="animate-spin h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>Copy Link</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="cursor-pointer gap-2">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-between sm:justify-start overflow-hidden flex-nowrap">
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleStream();
        }}
        disabled={isStreaming}
        className="flex-1 min-w-0 sm:flex-none h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
        id={`stream-${fileName}`}
      >
        {isStreaming ? (
          <Loader2 className="animate-spin shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Play className="fill-current shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
        <span className="truncate">{isMedia ? "Stream" : "Open"}</span>
      </Button>

      {isMedia && LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleSyncplay();
              }}
              disabled={isSyncplaying}
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
              id={`syncplay-${fileName}`}
            >
              {isSyncplaying ? (
                <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Syncplay with friends</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
            disabled={isCopying}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            id={`copy-link-${fileName}`}
          >
            {isCopying ? (
              <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy Link</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            id={`download-${fileName}`}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download file</TooltipContent>
      </Tooltip>
    </div>
  );
}