"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Tv, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileStore } from "@/lib/store";
import { WatchedProgressBar } from "@/components/watched-progress-bar";
import { FileActions } from "@/components/file-actions";

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

export function TvShowDetail({ showTitle, playerProtocol, onBack }: TvShowDetailProps) {
  const { viewMode } = useFileStore();
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

                {/* Desktop Actions Row */}
                <div className="hidden sm:flex w-full sm:w-56 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-3 sm:mt-0 shrink-0">
                  <FileActions
                    torrentId={ep.torrent_id}
                    fileId={ep.file_id}
                    fileName={ep.filename}
                    isMedia={true}
                    playerProtocol={playerProtocol}
                    accountId={ep.account_id}
                  />
                </div>

                {/* Mobile Actions Dropdown */}
                <div className="absolute top-3 right-3 sm:hidden z-10">
                  <FileActions
                    variant="dropdown"
                    torrentId={ep.torrent_id}
                    fileId={ep.file_id}
                    fileName={ep.filename}
                    isMedia={true}
                    playerProtocol={playerProtocol}
                    accountId={ep.account_id}
                  />
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
                  </div>

                  <div className="p-4 space-y-1.5">
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

                {/* Mobile Actions Dropdown */}
                <div className="absolute top-2 right-2 z-20 sm:hidden">
                  <FileActions
                    variant="dropdown"
                    torrentId={ep.torrent_id}
                    fileId={ep.file_id}
                    fileName={ep.filename}
                    isMedia={true}
                    playerProtocol={playerProtocol}
                    accountId={ep.account_id}
                  />
                </div>

                {/* Action Bar (Desktop) */}
                <div className="hidden sm:flex p-2 sm:p-3 pt-0 border-t border-border/20 mt-2 shrink-0">
                  <FileActions
                    torrentId={ep.torrent_id}
                    fileId={ep.file_id}
                    fileName={ep.filename}
                    isMedia={true}
                    playerProtocol={playerProtocol}
                    accountId={ep.account_id}
                  />
                </div>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
