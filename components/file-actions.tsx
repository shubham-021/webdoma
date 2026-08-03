"use client";

import { Copy, Play, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { buildPlayerURL } from "@/lib/players";

interface FileActionsProps {
  filePath: string;
  fileName: string;
  isMedia: boolean;
  playerProtocol: string;
  accountId: number;
}

export function FileActions({
  filePath,
  fileName,
  isMedia,
  playerProtocol,
  accountId,
}: FileActionsProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const createTokenAndGetURL = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, account_id: accountId }),
      });

      if (!res.ok) {
        toast.error("Failed to create stream token");
        return null;
      }

      const data = await res.json();
      const streamURL = `${window.location.origin}/api/stream${filePath}?token=${data.token}`;
      return streamURL;
    } catch {
      toast.error("Network error");
      return null;
    }
  }, [filePath, accountId]);

  const getDirectWebdavCipher = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/direct-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, account_id: accountId }),
      });

      if (!res.ok) {
        toast.error("Failed to get encrypted stream cipher");
        return null;
      }

      const data = await res.json();
      return data.cipher;
    } catch {
      toast.error("Network error");
      return null;
    }
  }, [filePath, accountId]);

  const handleCopyLink = useCallback(async () => {
    setIsCopying(true);
    try {
      const streamURL = await createTokenAndGetURL();
      if (!streamURL) return;

      await navigator.clipboard.writeText(streamURL);
      toast.success("Link copied to clipboard", {
        description: `Valid for 1 hour`,
      });
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setIsCopying(false);
    }
  }, [createTokenAndGetURL]);

  // Players that support local client-side daemon launch (Aemond)
  const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

  const handleStream = useCallback(async () => {
    setIsStreaming(true);
    try {
      if (LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) {
        // FAST DIRECT PATH: Fetch encrypted WebDAV URL for Aemond daemon
        const cipher = await getDirectWebdavCipher();
        if (!cipher) return;

        try {
          const daemonRes = await fetch("http://localhost:9070/play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player: playerProtocol, cipher }),
          });

          if (daemonRes.ok) {
            toast.success(`Launched ${playerProtocol.toUpperCase()} via Local Daemon`, {
              description: "High-speed encrypted bypass active",
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
      const streamURL = await createTokenAndGetURL();
      if (!streamURL) return;

      const playerURL = buildPlayerURL(playerProtocol, streamURL);

      const link = document.createElement("a");
      link.href = playerURL;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Opening in ${playerProtocol.toUpperCase()}`, {
        description: "Standard proxy stream active",
      });
    } catch {
      toast.error("Failed to open stream");
    } finally {
      setIsStreaming(false);
    }
  }, [getDirectWebdavCipher, createTokenAndGetURL, playerProtocol, fileName, filePath, accountId]);

  const handleDownload = useCallback(() => {
    const encodedPath = filePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    window.open(`/api/download${encodedPath}?account_id=${accountId}`, "_blank");
    toast.success("Download started", { description: fileName });
  }, [filePath, fileName, accountId]);

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
        <TooltipContent>Copy stream link</TooltipContent>
      </Tooltip>

      {isMedia && (
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