"use client";

import { FileText, Play, Download, Copy, FolderOpen, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { launchPlayback } from "@/lib/client-play";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return narrow;
}

interface OtherFile {
  id: number;
  account_id: number;
  torrent_id: number;
  file_id: number;
  remote_path: string;
  filename: string;
  sizeFormatted: string;
  mime_type: string;
}

interface OtherFilesViewProps {
  files: OtherFile[];
  isLoading: boolean;
  searchQuery: string;
  playerProtocol: string;
}

const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

async function fetchCdnLink(torrentId: number, fileId: number, accountId: number): Promise<string | null> {
  try {
    const res = await fetch("/api/cdn-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torrent_id: torrentId, file_id: fileId, account_id: accountId }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || "Failed to get CDN link");
    return data.url;
  } catch (e: any) {
    toast.error(e.message || "Failed to get CDN link");
    return null;
  }
}

export function OtherFilesView({ files, isLoading, searchQuery, playerProtocol }: OtherFilesViewProps) {
  const narrow = useNarrow(640);

  const filtered = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = useCallback(async (file: OtherFile) => {
    const cdnUrl = await fetchCdnLink(file.torrent_id, file.file_id, file.account_id);
    if (!cdnUrl) return;

    try {
      await navigator.clipboard.writeText(cdnUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  const handleStream = useCallback(async (file: OtherFile) => {
    await launchPlayback({
      torrentId: file.torrent_id,
      fileId: file.file_id,
      accountId: file.account_id,
      playerProtocol,
    });
  }, [playerProtocol]);

  const handleDownload = useCallback(async (file: OtherFile) => {
    const cdnUrl = await fetchCdnLink(file.torrent_id, file.file_id, file.account_id);
    if (!cdnUrl) return;
    window.open(cdnUrl, "_blank");
    toast.success("Download started");
  }, []);

  const handleSyncplay = useCallback(async (file: OtherFile) => {
    if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) return;

    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncplay", player: playerProtocol, torrent_id: file.torrent_id, file_id: file.file_id, account_id: file.account_id }),
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
        description: e.message || "Ensure syncplay.conf is configured.",
      });
    }
  }, [playerProtocol]);

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

          {narrow ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => handleStream(file)}
                className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-2.5"
              >
                <Play size={13} className="fill-current" />
                Open
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-xs cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-37.5 bg-popover/95 backdrop-blur-xl border-border/60 shadow-xl rounded-xl p-1">
                  <DropdownMenuItem onClick={() => handleCopyLink(file)} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-primary/10 focus:bg-primary/10">
                    <Copy size={14} className="text-muted-foreground" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(file)} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-emerald-500/10 focus:bg-emerald-500/10">
                    <Download size={14} className="text-emerald-400" />
                    Download
                  </DropdownMenuItem>
                  {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                    <DropdownMenuItem onClick={() => handleSyncplay(file)} className="gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-amber-500/10 focus:bg-amber-500/10">
                      <Users size={14} className="text-amber-400" />
                      Syncplay
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={() => handleStream(file)}
                className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Play size={13} className="fill-current" />
                Open
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopyLink(file)}
                className="h-8 w-8 text-xs cursor-pointer"
                title="Copy Link"
              >
                <Copy size={13} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDownload(file)}
                className="h-8 w-8 text-xs cursor-pointer"
                title="Download File"
              >
                <Download size={13} />
              </Button>
              {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleSyncplay(file)}
                  className="h-8 w-8 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                  title="Syncplay with friends"
                >
                  <Users size={13} />
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
