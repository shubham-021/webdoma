"use client";

import { useEffect, useState, useCallback } from "react";
import { Film, Tv, FolderOpen, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoviesGrid } from "@/components/movies-grid";
import { TvShowsGrid } from "@/components/tv-shows-grid";
import { TvShowDetail } from "@/components/tv-show-detail";
import { OtherFilesView } from "@/components/other-files-view";
import { toast } from "sonner";
import { useFileStore } from "@/lib/store";

interface FileBrowserProps {
  playerProtocol: string;
  hasAccounts: boolean;
}

export function FileBrowser({ playerProtocol, hasAccounts }: FileBrowserProps) {
  const { activeAccountId } = useFileStore();

  const [activeTab, setActiveTab] = useState<"movies" | "tv" | "other">("movies");
  const [selectedShowTitle, setSelectedShowTitle] = useState<string | null>(null);

  const [movies, setMovies] = useState<any[]>([]);
  const [tvShows, setTvShows] = useState<any[]>([]);
  const [otherFiles, setOtherFiles] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = activeAccountId ? `?account_id=${activeAccountId}` : "";

      if (activeTab === "movies") {
        const res = await fetch(`/api/library/movies${query}`);
        const data = await res.json();
        setMovies(data.items || []);
      } else if (activeTab === "tv") {
        const res = await fetch(`/api/library/tv${query}`);
        const data = await res.json();
        setTvShows(data.shows || []);
      } else if (activeTab === "other") {
        const res = await fetch(`/api/library/other${query}`);
        const data = await res.json();
        setOtherFiles(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load library data:", e);
      toast.error("Failed to fetch library content");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, activeAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const doSync = useCallback(async () => {
    if (!activeAccountId) {
      toast.error("No active account selected");
      return;
    }

    setIsSyncing(true);
    toast.info("Syncing TorBox remote...");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: activeAccountId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Sync failed");

      toast.success(`Sync completed! ${data.files_synced ?? 0} files indexed.`);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }, [activeAccountId, loadData]);

  // Lightweight refresh when files are inserted inline (no full TorBox API re-sync)
  useEffect(() => {
    const handleFilesUpdated = () => {
      loadData();
    };
    window.addEventListener("torrent-files-updated", handleFilesUpdated);
    return () => window.removeEventListener("torrent-files-updated", handleFilesUpdated);
  }, [loadData]);

  // Manual sync (with confirmation)
  const handleSyncClick = () => {
    setShowSyncConfirm(true);
  };

  const handleSyncConfirm = () => {
    setShowSyncConfirm(false);
    doSync();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Navigation Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border/50 bg-card/20 shrink-0">
        {/* Library Category Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
          <Button
            variant={activeTab === "movies" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("movies");
              setSelectedShowTitle(null);
            }}
            className="gap-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Film size={15} />
            <span>Movies</span>
          </Button>

          <Button
            variant={activeTab === "tv" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("tv");
              setSelectedShowTitle(null);
            }}
            className="gap-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Tv size={15} />
            <span>TV Shows</span>
          </Button>

          <Button
            variant={activeTab === "other" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("other");
              setSelectedShowTitle(null);
            }}
            className="gap-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <FolderOpen size={15} />
            <span>Other Files</span>
          </Button>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!selectedShowTitle && (
            <div className="relative flex-1 sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={`Search ${activeTab === "movies" ? "movies" : activeTab === "tv" ? "TV shows" : "files"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/30 text-xs rounded-xl"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncClick}
            disabled={isSyncing || !hasAccounts}
            className="h-9 gap-1.5 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
            title="Sync TorBox files & fetch metadata"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing..." : "Sync Remote"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedShowTitle && activeTab === "tv" ? (
          <TvShowDetail
            showTitle={selectedShowTitle}
            activeAccountId={activeAccountId}
            playerProtocol={playerProtocol}
            onBack={() => setSelectedShowTitle(null)}
          />
        ) : activeTab === "movies" ? (
          <MoviesGrid
            movies={movies}
            isLoading={isLoading}
            searchQuery={searchQuery}
            playerProtocol={playerProtocol}
            activeAccountId={activeAccountId}
          />
        ) : activeTab === "tv" ? (
          <TvShowsGrid
            shows={tvShows}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSelectShow={(title) => setSelectedShowTitle(title)}
          />
        ) : (
          <OtherFilesView
            files={otherFiles}
            isLoading={isLoading}
            searchQuery={searchQuery}
            playerProtocol={playerProtocol}
            activeAccountId={activeAccountId}
          />
        )}
      </div>

      {/* Sync Confirmation Dialog */}
      <Dialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={18} className="text-primary" />
              Sync Remote Files?
            </DialogTitle>
            <DialogDescription>
              This will <span className="font-semibold text-foreground">clear all stored file data</span> for this account and re-fetch everything fresh from TorBox. All files will be re-parsed and metadata will be fetched from TMDB. This may take a moment depending on how many files you have.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSyncConfirm(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSyncConfirm}
              className="rounded-xl cursor-pointer"
            >
              Yes, Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

