"use client";

import { useEffect, useState } from "react";
import type { FileItem } from "@/lib/types";
import { getFileType } from "@/lib/utils";
import { FileIcon } from "@/components/file-icon";
import { FileActions } from "@/components/file-actions";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FileCardProps {
  item: FileItem;
  viewMode: "grid" | "list";
  playerProtocol: string;
  onNavigate: (path: string) => void;
}

function getFileTypeBadgeVariant(fileType: string) {
  const variantMap: Record<string, "video" | "audio" | "archive" | "subtitle" | "image" | "document" | "secondary"> = {
    video: "video",
    audio: "audio",
    archive: "archive",
    subtitle: "subtitle",
    image: "image",
    document: "document",
  };
  return variantMap[fileType] || "secondary";
}

export function FileCard({ item, viewMode, playerProtocol, onNavigate }: FileCardProps) {
  const isDirectory = false; // All items from DB are files (videos > 500MB)
  const fileType = getFileType(item.filename);
  const isMedia = fileType === "video" || fileType === "audio";

  // Use DB-joined metadata directly (no client-side fetch needed)
  const hasTmdbMatch = item.tmdb_id !== null;
  const displayTitle = hasTmdbMatch && item.media_title ? item.media_title : item.raw_title || item.filename;
  const displayYear = hasTmdbMatch && item.media_year ? item.media_year : item.raw_year || "";
  const posterUrl = hasTmdbMatch ? item.media_poster_url : null;

  const handleClick = () => {
    // No directory navigation in flat list view
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent transition-all duration-200 hover:bg-muted/50"
        )}
      >
        {posterUrl ? (
          <div className="w-10 h-14 rounded shrink-0 overflow-hidden bg-muted/50 border border-border/50 relative shadow-sm">
            <img src={posterUrl} alt={displayTitle} className="object-cover w-full h-full" loading="lazy" />
          </div>
        ) : (
          <FileIcon filename={item.filename} isDirectory={false} size={24} />
        )}

        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm font-medium truncate">
                {displayTitle} {displayYear ? `(${displayYear})` : ""}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {item.filename}
            </TooltipContent>
          </Tooltip>
        </div>

        <Badge variant={getFileTypeBadgeVariant(fileType)} className="hidden sm:inline-flex">
          {fileType}
        </Badge>

        <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block">
          {item.sizeFormatted}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex w-48 sm:w-56 shrink-0 justify-end">
          <FileActions
            torrentId={item.torrent_id}
            fileId={item.file_id}
            fileName={item.filename}
            isMedia={isMedia}
            playerProtocol={playerProtocol}
            accountId={item.account_id}
          />
        </div>
      </div>
    );
  }

  // Grid view - Jellyfin like poster
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/50 bg-card transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1"
      )}
    >
      {/* Poster / Image Section */}
      <div className="relative aspect-2/3 w-full bg-muted/30 overflow-hidden">
        {posterUrl ? (
          <img src={posterUrl} alt={displayTitle} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <FileIcon filename={item.filename} isDirectory={false} size={48} />
          </div>
        )}

        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />

        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-[10px] bg-black/60 text-white backdrop-blur-md border-0">
            {item.filename.split(".").pop()?.toUpperCase() || ""}
          </Badge>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20 bg-background/90 backdrop-blur-md border-t border-border/50 flex w-full">
          <FileActions
            torrentId={item.torrent_id}
            fileId={item.file_id}
            fileName={item.filename}
            isMedia={isMedia}
            playerProtocol={playerProtocol}
            accountId={item.account_id}
          />
        </div>
      </div>

      {/* Title & Info Section */}
      <div className="p-3 w-full min-w-0 z-10 bg-card">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm font-semibold truncate leading-tight mb-1">
              {displayTitle}
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {item.filename}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-medium">{item.sizeFormatted}</span>
          <span className="text-xs text-muted-foreground/50">•</span>
          <span className="text-xs text-muted-foreground truncate">
            {displayYear}
          </span>
        </div>
      </div>
    </div>
  );
}