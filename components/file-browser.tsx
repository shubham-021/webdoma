"use client";

import { useEffect, useCallback } from "react";
import { RefreshCw, LayoutGrid, List, Search, ArrowUpDown, FolderOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FileCard } from "@/components/file-card";
import { toast } from "sonner";
import { useFileStore } from "@/lib/store";
import type { SortKey, SortOrder } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileBrowserProps {
  playerProtocol: string;
}

export function FileBrowser({ playerProtocol }: FileBrowserProps) {
  const {
    currentPath,
    isLoading,
    error,
    viewMode,
    searchQuery,
    sortKey,
    sortOrder,
    directoryCache,
    activeUsername,
    fetchFiles,
    setCurrentPath,
    setViewMode,
    setSearchQuery,
    setSortKey,
    setSortOrder,
    toggleSort,
  } = useFileStore();

  const cacheKey = activeUsername ? `${activeUsername}:${currentPath}` : currentPath;
  const currentDirData = directoryCache[cacheKey];
  const items = currentDirData?.items || [];
  const breadcrumbs = currentDirData?.breadcrumbs || [];
  const lastRefreshed = currentDirData?.lastRefreshed;

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, activeUsername, fetchFiles]);

  const handleNavigate = useCallback(
    (path: string) => {
      setCurrentPath(path);
    },
    [setCurrentPath]
  );

  const handleRefresh = useCallback(async () => {
    await fetchFiles(currentPath, true);
    toast.success("Refreshed");
  }, [fetchFiles, currentPath]);

  // Filter and sort
  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Directories always first
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;

      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          });
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "date":
          comparison =
            new Date(a.lastModified).getTime() -
            new Date(b.lastModified).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border/50">
        <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30"
              id="search-files"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-1.5 px-3 shrink-0 cursor-pointer text-xs font-medium border border-border/50 bg-muted/20 hover:bg-muted/30"
                title={`Sort by ${sortKey} (${sortOrder === "asc" ? "Ascending" : "Descending"})`}
                id="sort-toggle"
              >
                <ArrowUpDown size={15} />
                <span className="hidden md:inline capitalize">Sort: {sortKey} ({sortOrder === "asc" ? "Asc" : "Desc"})</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] outline-none">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}
              >
                <DropdownMenuRadioItem value="name" className="cursor-pointer">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size" className="cursor-pointer">Size</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date" className="cursor-pointer">Date Modified</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as SortOrder)}
              >
                <DropdownMenuRadioItem value="asc" className="cursor-pointer">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc" className="cursor-pointer">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center rounded-lg border border-border/50 p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7"
              id="view-grid"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-7 w-7"
              id="view-list"
            >
              <List size={14} />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9 shrink-0"
            id="refresh-files"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* Last refreshed */}
      {lastRefreshed && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground/60">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                : "flex flex-col gap-1"
            }
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className={viewMode === "grid" ? "h-32 rounded-xl" : "h-14 rounded-lg"}
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <AlertCircle size={48} className="text-destructive/50" />
            <p className="text-lg font-medium">Failed to load</p>
            <p className="text-sm">{error}</p>
            <Button onClick={handleRefresh} variant="outline" id="retry-load">
              Try again
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <FolderOpen size={48} className="text-muted-foreground/30" />
            <p className="text-lg font-medium">
              {searchQuery ? "No matching files" : "This folder is empty"}
            </p>
            <p className="text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Files added to TorBox may take up to 15 minutes to appear"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                : "flex flex-col gap-1"
            }
          >
            {filteredItems.map((item, index) => (
              <FileCard
                key={`${item.path}-${index}`}
                item={item}
                viewMode={viewMode}
                playerProtocol={playerProtocol}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
