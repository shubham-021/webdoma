"use client";

import { useEffect, useState } from "react";

interface WatchedProgressBarProps {
  accountId: number;
  torrentId: number;
  fileId: number;
}

/**
 * Thin full-width progress bar shown at the bottom of a media card.
 * Fetches resume state from GET /api/progress (backed by the user_watched
 * table) and re-checks when the window regains focus (e.g. returning from mpv).
 */
export function WatchedProgressBar({ accountId, torrentId, fileId }: WatchedProgressBarProps) {
  const [percent, setPercent] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      const params = new URLSearchParams({
        account_id: String(accountId),
        torrent_id: String(torrentId),
        file_id: String(fileId),
      });
      fetch(`/api/progress?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          const position = Number(data.position ?? 0);
          const duration = data.duration == null ? null : Number(data.duration);
          const isCompleted = Boolean(data.completed);
          setCompleted(isCompleted);
          if (isCompleted) return;
          let pct = 0;
          if (position > 0 && duration != null && duration > 0) {
            pct = Math.min(100, (position / duration) * 100);
          }
          setPercent(pct);
        })
        .catch(() => {});
    };

    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [accountId, torrentId, fileId]);

  if (completed || percent === null || percent <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[3px] bg-black/60"
      aria-label="Watched progress"
    >
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}
