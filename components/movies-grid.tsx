"use client";

import { Film, Play, Download, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";
import { LOCAL_DAEMON_PLAYERS } from "@/lib/constants";
import { launchPlayback } from "@/lib/client-play";
import { WatchedProgressBar } from "@/components/watched-progress-bar";
import { useFileStore } from "@/lib/store";

interface MovieItem {
  id: number;
  account_id: number;
  torrent_id: number;
  file_id: number;
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
}

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

export function MoviesGrid({ movies, isLoading, searchQuery, playerProtocol }: MoviesGridProps) {
  const { viewMode } = useFileStore();

  const filtered = movies.filter((m) =>
    (m.title || m.filename).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = useCallback(async (movie: MovieItem) => {
    const cdnUrl = await fetchCdnLink(movie.torrent_id, movie.file_id, movie.account_id);
    if (!cdnUrl) return;

    try {
      await navigator.clipboard.writeText(cdnUrl);
      toast.success("CDN link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  const handleStream = useCallback(async (movie: MovieItem) => {
    await launchPlayback({
      torrentId: movie.torrent_id,
      fileId: movie.file_id,
      accountId: movie.account_id,
      playerProtocol,
    });
  }, [playerProtocol]);

  const handleSyncplay = useCallback(async (movie: MovieItem) => {
    if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) return;
    const cdnUrl = await fetchCdnLink(movie.torrent_id, movie.file_id, movie.account_id);
    if (!cdnUrl) return;

    try {
      const daemonRes = await fetch("http://localhost:9070/syncplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: playerProtocol, url: cdnUrl }),
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
  }, [playerProtocol]);

  const handleDownload = useCallback(async (movie: MovieItem) => {
    const cdnUrl = await fetchCdnLink(movie.torrent_id, movie.file_id, movie.account_id);
    if (!cdnUrl) return;
    window.open(cdnUrl, "_blank");
    toast.success("Download started");
  }, []);

  if (isLoading) {
    return (
      <div className={viewMode === "list" ? "flex flex-col gap-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className={viewMode === "list" ? "h-20 w-full rounded-xl" : "aspect-2/3 rounded-xl"} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Film size={48} className="text-muted-foreground/30 mb-2" />
        <p className="text-lg font-medium">No movies found</p>
        <p className="text-sm">Try syncing your TorBox account or adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className={viewMode === "list" ? "flex flex-col gap-3" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"}>
      {filtered.map((movie) => (
        viewMode === "list" ? (
          <div
            key={movie.id}
            className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 px-4 py-3 rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 transition-all overflow-hidden relative"
          >
            {/* Poster Thumbnail */}
            <div className="w-12 h-16 shrink-0 rounded bg-muted/30 overflow-hidden relative border border-border/50">
              {movie.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.poster_url} alt={movie.title} className="object-cover w-full h-full" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Film size={20} className="opacity-40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="text-sm font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                {movie.filename}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                {movie.year && <span>{movie.year}</span>}
                {movie.year && <span className="text-muted-foreground/50">•</span>}
                <span>{movie.sizeFormatted}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity sm:mt-0 pb-1 sm:pb-0">
                <Button
                  size="sm"
                  onClick={() => handleStream(movie)}
                  className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                >
                  <Play size={13} className="fill-current" />
                  Stream
                </Button>
                {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleSyncplay(movie)}
                    className="h-8 w-8 shrink-0 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                    title="Syncplay with friends"
                  >
                    <Users size={13} />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyLink(movie)}
                  className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                  title="Copy CDN Link"
                >
                  <Copy size={13} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleDownload(movie)}
                  className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                  title="Download File"
                >
                  <Download size={13} />
                </Button>
            </div>
            
            <WatchedProgressBar
              accountId={movie.account_id}
              torrentId={movie.torrent_id}
              fileId={movie.file_id}
            />
          </div>
        ) : (
        <Card
          key={movie.id}
          className="group relative overflow-hidden rounded-xl border-0 bg-black/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20"
        >
          {/* Full poster card — no separate info section */}
          <div className="relative aspect-2/3 w-full overflow-hidden bg-muted/40">
            {movie.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted/20 text-muted-foreground">
                <Film size={48} className="opacity-40" />
              </div>
            )}

            {/* Always-visible bottom gradient overlay with title */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent pt-24 pb-3.5 px-3.5 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
              <h3 className="text-lg font-display font-bold text-white leading-snug line-clamp-2 drop-shadow-lg tracking-wide">
                {movie.title}
              </h3>
            </div>

            {/* Hover overlay: metadata + action buttons */}
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/85 to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4 gap-3">
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
                  onClick={() => handleStream(movie)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <Play size={15} className="fill-current" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleCopyLink(movie)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Copy CDN Link"
                >
                  <Copy size={15} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(movie)}
                  className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Download File"
                >
                  <Download size={15} />
                </Button>
                {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleSyncplay(movie)}
                    className="h-10 w-10 shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 cursor-pointer"
                    title="Syncplay with friends"
                  >
                    <Users size={15} />
                  </Button>
                )}
              </div>
            </div>

            {/* Resume progress bar at the bottom of the card */}
            <WatchedProgressBar
              accountId={movie.account_id}
              torrentId={movie.torrent_id}
              fileId={movie.file_id}
            />
          </div>
        </Card>
        )
      ))}
    </div>
  );
}
