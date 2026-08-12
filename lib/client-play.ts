import { toast } from "sonner";
import { LOCAL_DAEMON_PLAYERS } from "@/lib/constants";

/**
 * Shared playback orchestration used by FileActions and MoviesGrid.
 * Makes a single request to the backend which handles CDN generation,
 * resume state fetching, and spawning the player process.
 */
export async function launchPlayback(params: {
  torrentId: number;
  fileId: number;
  accountId: number;
  playerProtocol: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { torrentId, fileId, accountId, playerProtocol } = params;

  const toastId = toast.loading(`Preparing to launch ${playerProtocol.toUpperCase()}...`);

  if (!LOCAL_DAEMON_PLAYERS.includes(playerProtocol)) {
    // If it's a protocol handler player (not a daemon-managed local process),
    // we may need different handling, but based on the code provided, 
    // LOCAL_DAEMON_PLAYERS is checked elsewhere, or we should fallback.
    // For now, let's let the backend try to resolve it.
  }

  try {
    const res = await fetch("/api/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "play",
        player: playerProtocol,
        torrent_id: torrentId,
        file_id: fileId,
        account_id: accountId,
      }),
    });

    const data = await res.json();
    
    if (res.ok && data.ok) {
      toast.success(`Launched ${playerProtocol.toUpperCase()}`, {
        id: toastId,
        description: "Playback has started successfully",
      });
      return { ok: true };
    }
    
    const message = data.error || "Failed to launch player";
    toast.error(message, { id: toastId });
    return { ok: false, error: message };
  } catch (error) {
    toast.error("Failed to connect to the backend", {
      id: toastId,
      description: "Ensure the Next.js server is running.",
    });
    return { ok: false, error: "Network error" };
  }
}
