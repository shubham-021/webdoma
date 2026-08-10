interface WatchedProgressBarProps {
  percent: number | null;
  completed?: boolean;
}

/**
 * Thin full-width progress bar shown at the bottom of a media card.
 */
export function WatchedProgressBar({ percent, completed = false }: WatchedProgressBarProps) {
  const isVisible = percent !== null && percent > 0 && !completed;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 transition-colors ${isVisible ? "bg-black/60" : "bg-transparent"
        }`}
      aria-label={isVisible ? "Watched progress" : undefined}
    >
      {isVisible && (
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      )}
    </div>
  );
}
