"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Play, Download, Copy, Tv, Layers, Film, Loader2, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { launchPlayback } from "@/lib/client-play";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileStore } from "@/lib/store";
import { WatchedProgressBar } from "@/components/watched-progress-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Episode {
  id: number;
  account_id: number;
  torrent_id: number;
  file_id: number;
  remote_path: string;
  filename: string;
  sizeFormatted: string;
  season_number: number;
  episode_number: number;
  episode_title: string;
  episode_overview?: string;
  still_url?: string;
  percent?: number;
  completed?: boolean;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

interface ShowInfo {
  showTitle: string;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  tmdbId?: number;
}

interface TvShowDetailProps {
  showTitle: string;
  playerProtocol: string;
  onBack: () => void;
}

const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];

function useCompactActions() {
  const { sidebarCollapsed } = useFileStore();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => {
      if (sidebarCollapsed) {
        setCompact(window.innerWidth < 1210);
      } else {
        setCompact(window.innerWidth < 1400);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [sidebarCollapsed]);
  return compact;
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

export function TvShowDetail({ showTitle, playerProtocol, onBack }: TvShowDetailProps) {
  const { viewMode } = useFileStore();
  const compactActions = useCompactActions();
  const [showInfo, setShowInfo] = useState<ShowInfo | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShowDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const url = `/api/library/tv/${encodeURIComponent(showTitle)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load show detail");

        setShowInfo(data.show);
        setSeasons(data.seasons || []);
        if (data.seasons && data.seasons.length > 0) {
          setSelectedSeason(data.seasons[0].seasonNumber);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load show");
      } finally {
        setIsLoading(false);
      }
    }

    loadShowDetail();
  }, [showTitle]);

  const handleCopyLink = useCallback(async (ep: Episode) => {
    const cdnUrl = await fetchCdnLink(ep.torrent_id, ep.file_id, ep.account_id);
    if (!cdnUrl) return;

    try {
      await navigator.clipboard.writeText(cdnUrl);
      toast.success("Stream link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  const handleStream = useCallback(async (ep: Episode) => {
    await launchPlayback({
      torrentId: ep.torrent_id,
      fileId: ep.file_id,
      accountId: ep.account_id,
      playerProtocol,
    });
  }, [playerProtocol]);

  const handleDownload = useCallback(async (ep: Episode) => {
    const cdnUrl = await fetchCdnLink(ep.torrent_id, ep.file_id, ep.account_id);
    if (!cdnUrl) return;
    window.open(cdnUrl, "_blank");
    toast.success("Download started");
  }, []);

  const handleSyncplay = useCallback(async (ep: Episode) => {
    if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) return;
    const cdnUrl = await fetchCdnLink(ep.torrent_id, ep.file_id, ep.account_id);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} /> Back to TV Shows
        </Button>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !showInfo) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} /> Back to TV Shows
        </Button>
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">{error || "Show not found"}</p>
        </div>
      </div>
    );
  }

  const activeSeasonData = seasons.find((s) => s.seasonNumber === selectedSeason);

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-xs font-semibold cursor-pointer">
        <ArrowLeft size={15} /> Back to TV Shows
      </Button>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-2xl">
        {showInfo.backdropUrl && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showInfo.backdropUrl}
              alt=""
              className="h-full w-full object-cover opacity-20 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
          </div>
        )}

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          {showInfo.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={showInfo.posterUrl}
              alt={showInfo.showTitle}
              className="w-36 md:w-48 aspect-2/3 object-cover rounded-xl shadow-2xl shrink-0 border border-white/10"
            />
          ) : (
            <div className="w-36 md:w-48 aspect-2/3 bg-muted/40 rounded-xl flex items-center justify-center shrink-0">
              <Tv size={48} className="opacity-40" />
            </div>
          )}

          <div className="flex-1 space-y-3">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {showInfo.showTitle}
            </h1>

            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                <Layers size={13} /> {seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}
              </span>
            </div>

            {showInfo.overview && (
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {showInfo.overview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Season Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/50">
        {seasons.map((s) => (
          <Button
            key={s.seasonNumber}
            variant={selectedSeason === s.seasonNumber ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeason(s.seasonNumber)}
            className="rounded-lg text-xs font-semibold cursor-pointer shrink-0"
          >
            Season {s.seasonNumber} ({s.episodes.length})
          </Button>
        ))}
      </div>

      {/* Episode Cards Grid */}
      {activeSeasonData && (
        <div className={viewMode === "list" ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {activeSeasonData.episodes.map((ep) => (
            viewMode === "list" ? (
              <div
                key={ep.id}
                className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 px-4 py-3 rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 transition-all overflow-hidden relative"
              >
                {/* Still Thumbnail */}
                <div className="w-16 h-10 shrink-0 rounded bg-muted/30 overflow-hidden relative border border-border/50">
                  {ep.still_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ep.still_url} alt={ep.episode_title} className="object-cover w-full h-full" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Tv size={16} className="opacity-40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-sm font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                    {ep.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground/80">S{String(ep.season_number).padStart(2, "0")}E{String(ep.episode_number).padStart(2, "0")}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{ep.sizeFormatted}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity sm:mt-0 pb-1 sm:pb-0">
                  <Button
                    size="sm"
                    onClick={() => handleStream(ep)}
                    className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    <Play size={13} className="fill-current" />
                    Stream
                  </Button>
                  {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleSyncplay(ep)}
                      className="h-8 w-8 shrink-0 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                      title="Syncplay with friends"
                    >
                      <Users size={13} />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopyLink(ep)}
                    className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                    title="Copy Stream Link"
                  >
                    <Copy size={13} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDownload(ep)}
                    className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                    title="Download File"
                  >
                    <Download size={13} />
                  </Button>
                </div>

                <WatchedProgressBar
                  percent={ep.percent ?? null}
                  completed={ep.completed}
                />
              </div>
            ) : (
              <Card
                key={ep.id}
                className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Episode Still Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
                    {ep.still_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ep.still_url}
                        alt={ep.episode_title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted/20 text-muted-foreground">
                        <Tv size={36} className="opacity-30" />
                      </div>
                    )}

                    {/* Episode Number Badge */}
                    <span className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
                      S{String(ep.season_number).padStart(2, "0")}E{String(ep.episode_number).padStart(2, "0")}
                    </span>

                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      {ep.sizeFormatted}
                    </span>

                    {/* Compact: always-visible three-dots at top-right */}
                    {compactActions && (
                      <div className="absolute top-2 right-2 z-30">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-full bg-transparent hover:bg-black/50 text-white cursor-pointer transition-colors ring-0 focus:outline-none"
                            >
                              <MoreVertical size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={6} className="min-w-42.5 bg-popover/95 backdrop-blur-xl border-border/60 shadow-2xl rounded-xl p-1.5">
                            <DropdownMenuItem onClick={() => handleStream(ep)} className="gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-violet-500/10 focus:bg-violet-500/10">
                              <Play size={14} className="text-violet-400 fill-violet-400" />
                              Stream
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(ep)} className="gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-primary/10 focus:bg-primary/10">
                              <Copy size={14} className="text-muted-foreground" />
                              Copy link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(ep)} className="gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-emerald-500/10 focus:bg-emerald-500/10">
                              <Download size={14} className="text-emerald-400" />
                              Download
                            </DropdownMenuItem>
                            {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                              <DropdownMenuItem onClick={() => handleSyncplay(ep)} className="gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium hover:bg-amber-500/10 focus:bg-amber-500/10">
                                <Users size={14} className="text-amber-400" />
                                Syncplay
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5 flex-1">
                    <h4 className="text-sm font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {ep.episode_title}
                    </h4>
                    {ep.episode_overview && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {ep.episode_overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Bar (Only visible when NOT compact) */}
                {!compactActions && (
                  <div className="p-3 pt-0 flex items-center gap-1.5 border-t border-border/20 mt-auto shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleStream(ep)}
                      className="flex-1 h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                    >
                      <Play size={13} className="fill-current" />
                      Stream
                    </Button>
                    {LOCAL_DAEMON_PLAYERS.includes(playerProtocol) && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleSyncplay(ep)}
                        className="h-8 w-8 shrink-0 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                        title="Syncplay with friends"
                      >
                        <Users size={13} />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyLink(ep)}
                      className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                      title="Copy Stream Link"
                    >
                      <Copy size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDownload(ep)}
                      className="h-8 w-8 shrink-0 text-xs cursor-pointer"
                      title="Download File"
                    >
                      <Download size={13} />
                    </Button>
                  </div>
                )}
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
