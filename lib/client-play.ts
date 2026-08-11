import { toast } from "sonner";
import { buildPlayerURL } from "@/lib/players";
import { LOCAL_DAEMON_PLAYERS } from "@/lib/constants";

/**
 * Shared playback orchestration used by FileActions and MoviesGrid.
 * 1. POST /api/cdn-link → { url, playToken }
 * 2. GET  /api/progress  → resume state
 * 3. POST local daemon (/play) with resume info for daemon players,
 *    otherwise fall back to the protocol-handler path.
 */
export async function launchPlayback(params: {
  torrentId: number;
  fileId: number;
  accountId: number;
  playerProtocol: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { torrentId, fileId, accountId, playerProtocol } = params;

  const toastId = toast.loading(`Preparing to launch ${playerProtocol.toUpperCase()}...`);

  // 1. CDN link + play token
  let cdnUrl: string;
  let playToken: string;
  try {
    const res = await fetch("/api/cdn-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        torrent_id: torrentId,
        file_id: fileId,
        account_id: accountId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      const message = (data as { error?: string }).error || "Failed to get CDN link";
      toast.error(message, { id: toastId });
      return { ok: false, error: message };
    }
    cdnUrl = data.url;
    playToken = data.playToken;
  } catch {
    toast.error("Network error while resolving CDN link", { id: toastId });
    return { ok: false, error: "Network error" };
  }

  // 2. Resume state (best-effort; defaults to beginning on any failure)
  let startTime = "00:00";
  try {
    const query = new URLSearchParams({
      account_id: String(accountId),
      torrent_id: String(torrentId),
      file_id: String(fileId),
    });
    const res = await fetch(`/api/progress?${query.toString()}`);
    if (res.ok) {
      const progress = await res.json();
      const position = Number(progress.position ?? 0);
      const duration = progress.duration == null ? null : Number(progress.duration);
      const completed = Boolean(progress.completed);
      if (
        !completed &&
        position > 0 &&
        duration != null &&
        duration > 0 &&
        position < duration - 10
      ) {
        startTime = String(Math.floor(position));
      }
    }
  } catch {
    // ignore — start from the beginning
  }

  // 3. Launch via local daemon exclusively
  try {
    const daemonRes = await fetch("http://localhost:9070/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player: playerProtocol,
        url: cdnUrl,
        startTime,
        torrent_id: torrentId,
        file_id: fileId,
        account_id: accountId,
        token: playToken,
        reportUrl: `${window.location.origin}/api/progress`,
      }),
    });

    if (daemonRes.ok) {
      toast.success(`Launched ${playerProtocol.toUpperCase()}`, {
        id: toastId,
        description: "Playback has started successfully",
      });
      return { ok: true };
    }
    
    throw new Error("Daemon returned error status");
  } catch (error) {
    toast.error("Local daemon connection failed", {
      id: toastId,
      description: "Ensure Relay Aemond is running on port 9070 on your machine.",
    });
    return { ok: false, error: "Local daemon connection failed" };
  }
}
