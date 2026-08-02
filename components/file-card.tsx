"use client";

import { useEffect, useState } from "react";
import type { FileItem } from "@/lib/types";
import { getFileType } from "@/lib/utils";
import { FileIcon } from "@/components/file-icon";
import { FileActions } from "@/components/file-actions";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const isDirectory = item.type === "directory";
  const fileType = getFileType(item.name);
  const isMedia = item.isVideo || item.isAudio;
  
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [displayTitle, setDisplayTitle] = useState(item.name);
  const [displayYear, setDisplayYear] = useState(new Date(item.lastModified).getFullYear().toString());
  
  useEffect(() => {
    if (item.isVideo && !isDirectory) {
      const fetchMetadata = async () => {
        try {
          const res = await fetch(`/api/metadata?filename=${encodeURIComponent(item.name)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.posterUrl) setPosterUrl(data.posterUrl);
            if (data.title) setDisplayTitle(data.title);
            if (data.year) setDisplayYear(data.year);
          }
        } catch (e) {
          console.error("Failed to fetch metadata for", item.name, e);
        }
      };
      
      fetchMetadata();
    }
  }, [item.name, item.isVideo, isDirectory]);

  const handleClick = () => {
    if (isDirectory) {
      onNavigate(item.path);
    }
  };

  if (viewMode === "list") {
    // Keep list mode simple but still useful
    return (
      <div
        onClick={handleClick}
        className={`group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent transition-all duration-200 ${isDirectory
            ? "cursor-pointer hover:bg-primary/5 hover:border-primary/20"
            : "hover:bg-muted/50"
          }`}
      >
        {posterUrl ? (
          <div className="w-10 h-14 rounded shrink-0 overflow-hidden bg-muted/50 border border-border/50 relative shadow-sm">
            <img src={posterUrl} alt={displayTitle} className="object-cover w-full h-full" loading="lazy" />
          </div>
        ) : fileType === "image" ? (
          <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-muted/50 border border-border/50 relative shadow-sm">
            <img src={`/api/stream${item.path}`} alt={item.name} className="object-cover w-full h-full" loading="lazy" />
          </div>
        ) : (
          <FileIcon filename={item.name} isDirectory={isDirectory} size={24} />
        )}

        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={`text-sm font-medium truncate ${isDirectory ? "text-primary" : ""}`}>
                {displayTitle} {displayYear && !isDirectory ? `(${displayYear})` : ''}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {item.name}
            </TooltipContent>
          </Tooltip>
        </div>

        {!isDirectory && (
          <Badge variant={getFileTypeBadgeVariant(fileType)} className="hidden sm:inline-flex">
            {fileType}
          </Badge>
        )}

        <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block">
          {item.sizeFormatted}
        </span>

        {!isDirectory && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <FileActions
              filePath={item.path}
              fileName={item.name}
              isMedia={isMedia}
              playerProtocol={playerProtocol}
            />
          </div>
        )}
      </div>
    );
  }

  // Grid view - Jellyfin like poster
  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col rounded-xl border border-border/50 bg-card transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 ${isDirectory
          ? "cursor-pointer"
          : ""
        }`}
    >
      {/* Poster / Image Section */}
      <div className="relative aspect-[2/3] w-full bg-muted/30 overflow-hidden">
        {posterUrl ? (
          <img src={posterUrl} alt={displayTitle} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : fileType === "image" ? (
          <img src={`/api/stream${item.path}`} alt={item.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <FileIcon filename={item.name} isDirectory={isDirectory} size={48} />
          </div>
        )}
        
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
        
        {!isDirectory && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="text-[10px] bg-black/60 text-white backdrop-blur-md border-0">
              {item.extension.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Hover Actions */}
        {!isDirectory && (
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20 bg-background/90 backdrop-blur-md border-t border-border/50 flex justify-center">
            <FileActions
              filePath={item.path}
              fileName={item.name}
              isMedia={isMedia}
              playerProtocol={playerProtocol}
            />
          </div>
        )}
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
            {item.name}
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
