"use client";

import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide">
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1 shrink-0">
          {index > 0 && (
            <ChevronRight size={14} className="text-muted-foreground/50" />
          )}
          <button
            onClick={() => onNavigate(item.path)}
            className={cn(
              "px-2 py-1 rounded-md transition-colors duration-200 hover:bg-muted",
              index === items.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {index === 0 ? (
              <Home size={14} />
            ) : (
              <span className="max-w-37.5 truncate block">{item.name}</span>
            )}
          </button>
        </div>
      ))}
    </nav>
  );
}
