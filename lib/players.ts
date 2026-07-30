import { PLAYERS } from "./constants";

export function buildPlayerURL(
  playerProtocol: string,
  streamURL: string,
  customTemplate?: string
): string {
  const player = PLAYERS.find((p) => p.id === playerProtocol);

  if (!player) return streamURL;

  // Custom player: use user-provided template
  if (playerProtocol === "custom") {
    if (!customTemplate) return streamURL;
    const encoded = encodeURIComponent(streamURL);
    return customTemplate.replace("{url}", encoded);
  }

  if (!player.urlTemplate) return streamURL;

  // mpv-handler uses base64-encoded URL
  if (playerProtocol === "mpv") {
    const base64 = btoa(streamURL);
    return player.urlTemplate.replace("{base64url}", base64);
  }

  // Most players: encode the full stream URL
  const encoded = encodeURIComponent(streamURL);
  return player.urlTemplate.replace("{url}", encoded);
}

export { PLAYERS };
