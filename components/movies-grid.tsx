"use client";

import { Film, Play, Download, Copy, Calendar, FileText } from "lucide-react";
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filtered.map((movie) => (
        <Card
          key={movie.id}
          className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 flex flex-col"
        >
          {/* Poster Container */}
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted/40">
            {movie.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 text-muted-foreground">
                <Film size={40} className="opacity-40" />
              </div>
            )}

            {/* Hover overlay with action buttons */}
            <div className="absolute inset-0 bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 gap-2 backdrop-blur-[2px]">
              {movie.overview && (
                <p className="text-[11px] text-zinc-300 line-clamp-3 mb-1 font-normal leading-relaxed">
                  {movie.overview}
                </p>
              )}
              <div className="flex items-center gap-1.5 w-full">
                <Button
                  size="sm"
                  onClick={() => handleStream(movie.remote_path)}
                  className="flex-1 h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                >
                  <Play size={13} className="fill-current" />
                  Stream
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleCopyLink(movie.remote_path)}
                  className="h-8 w-8 shrink-0 text-xs bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Copy Stream Link"
                >
                  <Copy size={13} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(movie.remote_path)}
                  className="h-8 w-8 shrink-0 text-xs bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Download File"
                >
                  <Download size={13} />
                </Button>
              </div>
            </div>

            {/* Year Badge */}
            {movie.year && (
              <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md border border-white/10">
                {movie.year}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-3 flex flex-col flex-1 justify-between">
            <h3 className="text-xs font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>{movie.sizeFormatted}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
