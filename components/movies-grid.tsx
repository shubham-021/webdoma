"use client";

import { Film, Play, Download, Copy, Calendar, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { buildPlayerURL } from "@/lib/players";
import { Skeleton } from "@/components/ui/skeleton";

interface MovieItem {
  id: number;
  remote_path: string;
  filename: string;
  sizeFormatted: string;
  title: string;
  year?: string;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
}

interface MoviesGridProps {
  movies: MovieItem[];
  isLoading: boolean;
  searchQuery: string;
  playerProtocol: string;
  activeAccountId: number | null;
}

export function MoviesGrid({ movies, isLoading, searchQuery, playerProtocol, activeAccountId }: MoviesGridProps) {
  const filtered = movies.filter((m) =>
    (m.title || m.filename).toLowerCase().includes(searchQuery.toLowerCase())
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
      toast.success("Stream link copied to clipboard");
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

  const handleDownload = (remotePath: string) => {
    const encodedPath = remotePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    window.open(`/api/download${encodedPath}?account_id=${activeAccountId}`, "_blank");
    toast.success("Download started");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Film size={48} className="text-muted-foreground/30 mb-2" />
        <p className="text-lg font-medium">No movies found</p>
        <p className="text-sm">Try syncing your WebDAV account or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {filtered.map((movie) => (
        <Card
          key={movie.id}
          className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40"
        >
          {/* Full poster card — no separate info section */}
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/40">
            {movie.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 text-muted-foreground">
                <Film size={48} className="opacity-40" />
              </div>
            )}

            {/* Always-visible bottom gradient overlay with title */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-24 pb-3.5 px-3.5 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
              <h3 className="text-base font-extrabold text-white leading-snug line-clamp-2 drop-shadow-md">
                {movie.title}
              </h3>
            </div>

            {/* Hover overlay: metadata + action buttons */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4 gap-3">
              {/* Overview + metadata */}
              <div className="space-y-1.5">
                {movie.overview && (
                  <p className="text-[12px] text-zinc-300 line-clamp-4 font-normal leading-relaxed">
                    {movie.overview}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  {movie.year && <span>{movie.year}</span>}
                  {movie.year && <span className="text-zinc-600">•</span>}
                  <span>{movie.sizeFormatted}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full">
                <Button
                  size="sm"
                  onClick={() => handleStream(movie.remote_path)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <Play size={15} className="fill-current" />
                 
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleCopyLink(movie.remote_path)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Copy Stream Link"
                >
                  <Copy size={15} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(movie.remote_path)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Download File"
                >
                  <Download size={15} />
                </Button>
                {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleSyncplay(movie.remote_path)}
                    className="h-10 w-10 shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 cursor-pointer"
                    title="Syncplay with friends"
                  >
                    <Users size={15} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
