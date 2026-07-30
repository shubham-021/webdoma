import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  IMAGE_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
} from "./constants";

// Tailwind class merge utility (used by shadcn/ui components)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Determine file type from filename extension
export function getFileType(
  filename: string
): "video" | "audio" | "archive" | "subtitle" | "image" | "document" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ARCHIVE_EXTENSIONS.has(ext)) return "archive";
  if (SUBTITLE_EXTENSIONS.has(ext)) return "subtitle";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  return "other";
}

// Get MIME type from filename
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    // Video
    mp4: "video/mp4",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    webm: "video/webm",
    ts: "video/mp2t",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",
    m4v: "video/x-m4v",
    mpg: "video/mpeg",
    mpeg: "video/mpeg",
    m2ts: "video/mp2t",
    vob: "video/x-ms-vob",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
    // Audio
    mp3: "audio/mpeg",
    flac: "audio/flac",
    aac: "audio/aac",
    ogg: "audio/ogg",
    wav: "audio/wav",
    wma: "audio/x-ms-wma",
    m4a: "audio/mp4",
    opus: "audio/opus",
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
    // Subtitles
    srt: "text/plain",
    vtt: "text/vtt",
    ass: "text/plain",
    ssa: "text/plain",
    sub: "text/plain",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Documents
    pdf: "application/pdf",
    txt: "text/plain",
  };
  return mimeMap[ext] || "application/octet-stream";
}

// Format bytes to human-readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Get file extension from filename
export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

// Build breadcrumbs from a path string
export function buildBreadcrumbs(
  path: string
): { name: string; path: string }[] {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Home", path: "/" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += "/" + segment;
    breadcrumbs.push({
      name: decodeURIComponent(segment),
      path: currentPath,
    });
  }

  return breadcrumbs;
}
