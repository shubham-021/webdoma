import type { PlayerConfig } from "./types";

// File Extension Sets

export const VIDEO_EXTENSIONS = new Set([
  "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v",
  "mpg", "mpeg", "ts", "vob", "3gp", "ogv",
]);

export const EXCLUDED_EXTENSIONS = new Set([
  "m2ts", "bin",
]);

export const AUDIO_EXTENSIONS = new Set([
  "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "alac",
]);

export const ARCHIVE_EXTENSIONS = new Set([
  "zip", "rar", "7z", "tar", "gz", "bz2", "xz",
]);

export const SUBTITLE_EXTENSIONS = new Set([
  "srt", "sub", "ass", "ssa", "vtt",
]);

export const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff",
]);

export const DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx",
]);

// Player Configurations

export const PLAYERS: PlayerConfig[] = [
  {
    id: "vlc",
    name: "VLC Media Player",
    urlTemplate: "vlc://{url}",
    platforms: ["windows", "macos", "linux"],
  },
  {
    id: "iina",
    name: "IINA",
    urlTemplate: "iina://weblink?url={url}",
    platforms: ["macos"],
  },
  {
    id: "mpv",
    name: "mpv (via mpv-handler)",
    urlTemplate: "mpv://play/{base64url}",
    platforms: ["windows", "macos", "linux"],
  },
  {
    id: "potplayer",
    name: "PotPlayer",
    urlTemplate: "potplayer://{url}",
    platforms: ["windows"],
  },
  {
    id: "infuse",
    name: "Infuse",
    urlTemplate: "infuse://x-callback-url/play?url={url}",
    platforms: ["macos", "ios"],
  },
  {
    id: "custom",
    name: "Custom",
    urlTemplate: "",
    platforms: ["windows", "macos", "linux"],
  },
];

// Defaults

export const DEFAULT_PLAYER_PROTOCOL = "mpv";

// Players that support local client-side daemon launch (Aemond)
export const LOCAL_DAEMON_PLAYERS = ["mpv", "vlc", "iina"];
