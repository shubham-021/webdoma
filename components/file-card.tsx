"use client";

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

  const handleClick = () => {
    if (isDirectory) {
      onNavigate(item.path);
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleClick}
        className={`group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent transition-all duration-200 ${
          isDirectory
            ? "cursor-pointer hover:bg-primary/5 hover:border-primary/20"
            : "hover:bg-muted/50"
        }`}
      >
        <FileIcon filename={item.name} isDirectory={isDirectory} size={20} />

        <div className="flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={`text-sm font-medium truncate ${isDirectory ? "text-primary" : ""}`}>
                {item.name}
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

        <span className="text-xs text-muted-foreground w-28 text-right hidden md:block">
          {new Date(item.lastModified).toLocaleDateString()}
        </span>

        {!isDirectory && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

  // Grid view
  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 ${
        isDirectory
          ? "cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          : "hover:bg-muted/30 hover:border-border hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileIcon filename={item.name} isDirectory={isDirectory} size={24} />
          {!isDirectory && (
            <Badge variant={getFileTypeBadgeVariant(fileType)} className="text-[10px] shrink-0">
              {item.extension.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      <div className="w-full min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className={`text-sm font-medium truncate ${isDirectory ? "text-primary" : ""}`}>
              {item.name}
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {item.name}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{item.sizeFormatted}</span>
          <span className="text-xs text-muted-foreground/50">•</span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.lastModified).toLocaleDateString()}
          </span>
        </div>
      </div>

      {!isDirectory && (
        <div className="w-full pt-1 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
