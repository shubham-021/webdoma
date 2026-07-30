"use client";

import {
  Film, Music, Archive, FileText, Image, Subtitles,
  Folder, File, FileCode, FileSpreadsheet, FileImage,
} from "lucide-react";
import { getFileType } from "@/lib/utils";

interface FileIconProps {
  filename: string;
  isDirectory: boolean;
  className?: string;
  size?: number;
}

const FILE_TYPE_ICONS = {
  video: { icon: Film, className: "text-violet-400" },
  audio: { icon: Music, className: "text-emerald-400" },
  archive: { icon: Archive, className: "text-amber-400" },
  subtitle: { icon: Subtitles, className: "text-sky-400" },
  image: { icon: Image, className: "text-pink-400" },
  document: { icon: FileText, className: "text-orange-400" },
  other: { icon: File, className: "text-muted-foreground" },
} as const;

export function FileIcon({ filename, isDirectory, className, size = 20 }: FileIconProps) {
  if (isDirectory) {
    return <Folder size={size} className={`text-primary ${className || ""}`} />;
  }

  const fileType = getFileType(filename);
  const config = FILE_TYPE_ICONS[fileType];
  const Icon = config.icon;

  return <Icon size={size} className={`${config.className} ${className || ""}`} />;
}
