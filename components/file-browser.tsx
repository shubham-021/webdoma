"use client";

import { useEffect, useState, useCallback } from "react";
import { Film, Tv, FolderOpen, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoviesGrid } from "@/components/movies-grid";
import { TvShowsGrid } from "@/components/tv-shows-grid";
import { TvShowDetail } from "@/components/tv-show-detail";
import { OtherFilesView } from "@/components/other-files-view";
import { AddAccountForm } from "@/components/add-account-form";
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
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!hasAccounts) return;
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
  }, [activeTab, activeAccountId, hasAccounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lightweight refresh when files are inserted inline (no full TorBox API re-sync)
  useEffect(() => {
    const handleFilesUpdated = () => {
      loadData();
    };
    window.addEventListener("torrent-files-updated", handleFilesUpdated);
    return () => window.removeEventListener("torrent-files-updated", handleFilesUpdated);
  }, [loadData]);

  const handleAddAccountSuccess = () => {
    setIsAddAccountOpen(false);
    window.location.reload();
  };

  // No accounts — show centered add-account CTA
  if (!hasAccounts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PlusCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">No TorBox Accounts</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add a TorBox account to start browsing your movies, TV shows, and files.
          </p>
        </div>
        <Button
          onClick={() => setIsAddAccountOpen(true)}
          className="gap-2 cursor-pointer"
          size="lg"
          id="add-first-account"
        >
          <PlusCircle size={18} />
          Add TorBox Account
        </Button>
        <AddAccountForm
          open={isAddAccountOpen}
          onOpenChange={setIsAddAccountOpen}
          onSuccess={handleAddAccountSuccess}
        />
      </div>
    );
  }

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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedShowTitle && activeTab === "tv" ? (
          <TvShowDetail
            showTitle={selectedShowTitle}
            playerProtocol={playerProtocol}
            onBack={() => setSelectedShowTitle(null)}
          />
        ) : activeTab === "movies" ? (
          <MoviesGrid
            movies={movies}
            isLoading={isLoading}
            searchQuery={searchQuery}
            playerProtocol={playerProtocol}
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
          />
        )}
      </div>
    </div>
  );
}
