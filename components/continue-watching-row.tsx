"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Check, X } from "lucide-react";
import { toast } from "sonner";
import { launchPlayback } from "@/lib/client-play";
import type { ContinueWatchingItem } from "@/lib/types";

interface ContinueWatchingRowProps {
  playerProtocol: string;
}

export function ContinueWatchingRow({ playerProtocol }: ContinueWatchingRowProps) {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/library/continue-watching");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
      setLoaded(true);
    } catch {
      // ignore — row stays hidden
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const handleMarkCompleted = async (item: ContinueWatchingItem) => {
    const res = await fetch("/api/library/continue-watching/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: item.account_id, torrent_id: item.torrent_id, file_id: item.file_id }),
    });
    if (res.ok) {
      toast.success("Marked as watched");
      load();
    } else {
      toast.error("Failed to mark as watched");
    }
  };

  const handleHide = async (item: ContinueWatchingItem) => {
    const res = await fetch("/api/library/continue-watching/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: item.account_id, torrent_id: item.torrent_id, file_id: item.file_id }),
    });
    if (res.ok) {
      toast.success("Removed from continue watching");
      load();
    } else {
      toast.error("Failed to remove");
    }
  };

  if (!loaded || items.length === 0) return null;

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const subtitle = (item: ContinueWatchingItem) => {
    const sxxeyy =
      item.season_number != null && item.episode_number != null
        ? `S${pad2(item.season_number)}E${pad2(item.episode_number)}`
        : "";
    if (item.media_type === "movie") return item.year;
    if (item.media_type === "tv") {
      if (item.up_next) return `Up next · ${item.episode_title || sxxeyy}`;
      if (item.episode_title) return item.episode_title;
      return sxxeyy || item.show_title || "";
    }
    return item.filename;
  };

  return (
    <div>
      <h2 className="text-lg font-display font-bold tracking-wide text-foreground mb-3 flex items-center gap-2">
        <Play size={18} className="text-primary" />
        Continue Watching
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
        {items.map((item) => (
          <div
            key={`${item.account_id}-${item.torrent_id}-${item.file_id}`}
            onClick={() =>
              launchPlayback({
                torrentId: item.torrent_id,
                fileId: item.file_id,
                accountId: item.account_id,
                playerProtocol,
              })
            }
            className="shrink-0 snap-start w-52 sm:w-64 aspect-video rounded-xl border-0 bg-black/40 overflow-hidden group relative cursor-pointer"
          >
            {item.backdrop_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.backdrop_url}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted/50 to-muted/20 text-muted-foreground">
                <Play size={32} className="opacity-40" />
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkCompleted(item);
              }}
              title="Mark as watched"
              className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/70 border border-white/10 text-white
                         flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80 cursor-pointer"
            >
              <Check size={14} />
            </button>

            {item.media_type === "tv" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHide(item);
                }}
                title="Remove from continue watching"
                className="absolute bottom-2 right-2 z-10 h-6 w-6 rounded-full bg-black/70 border border-white/10 text-white
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}

            <div className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/75 to-transparent pl-3 pt-10 pb-3 ${item.media_type === "tv" ? "pr-9" : "pr-3"}`}>
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <h3 className="text-sm font-display font-bold text-white truncate">
                  {item.title}
                </h3>
                {item.media_type === "tv" && item.season_number != null && item.episode_number != null && (
                  <span className="shrink-0 text-[11px] font-medium text-white/50 tracking-wide">
                    S{pad2(item.season_number)}E{pad2(item.episode_number)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-300 line-clamp-1">{subtitle(item)}</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Play size={20} className="fill-current text-white" />
              </div>
            </div>

            {!item.up_next && item.percent > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-black/50">
                <div className="h-full bg-primary" style={{ width: `${item.percent}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
