import { create } from "zustand";
import type { FileItem, BreadcrumbItem } from "@/lib/types";

export type SortKey = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";

export interface DirectoryData {
  items: FileItem[];
  breadcrumbs: BreadcrumbItem[];
  lastRefreshed: Date;
}

interface FileStoreState {
  // Directory cache: maps path to its contents
  directoryCache: Record<string, DirectoryData>;
  currentPath: string;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  viewMode: "grid" | "list";
  searchQuery: string;
  sortKey: SortKey;
  sortOrder: SortOrder;

  // Actions
  setCurrentPath: (path: string) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSearchQuery: (query: string) => void;
  toggleSort: () => void;
  fetchFiles: (path: string, forceRefresh?: boolean) => Promise<void>;
}

export const useFileStore = create<FileStoreState>((set, get) => ({
  directoryCache: {},
  currentPath: "/",
  isLoading: false,
  error: null,
  
  viewMode: "grid",
  searchQuery: "",
  sortKey: "name",
  sortOrder: "asc",

  setCurrentPath: (path) => set({ currentPath: path, searchQuery: "" }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSort: () => {
    const { sortKey, sortOrder } = get();
    const keys: SortKey[] = ["name", "size", "date"];
    const currentIndex = keys.indexOf(sortKey);
    
    if (sortOrder === "desc") {
      set({ sortKey: keys[(currentIndex + 1) % keys.length], sortOrder: "asc" });
    } else {
      set({ sortOrder: "desc" });
    }
  },

  fetchFiles: async (path: string, forceRefresh = false) => {
    const { directoryCache } = get();

    // If we have cached data and aren't forcing a refresh, just set current path and return
    if (!forceRefresh && directoryCache[path]) {
      set({ currentPath: path, error: null, isLoading: false });
      return;
    }

    // Otherwise fetch
    set({ isLoading: true, error: null, currentPath: path });

    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await res.json();
      
      const newDirData: DirectoryData = {
        items: data.items,
        breadcrumbs: data.breadcrumbs,
        lastRefreshed: new Date(),
      };

      set((state) => ({
        directoryCache: {
          ...state.directoryCache,
          [path]: newDirData,
        },
        isLoading: false,
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "Failed to load files",
        isLoading: false 
      });
    }
  },
}));
