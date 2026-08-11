"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Magnet,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  FileVideo,
  FileText,
  HardDrive,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFileStore } from "@/lib/store";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

type CheckMode = "single" | "bulk";

interface CachedFileInfo {
  id: number;
  name: string;
  size: number;
  short_name: string;
  mimetype: string;
}

interface CachedTorrentResult {
  name: string;
  size: number;
  hash: string;
  files: CachedFileInfo[];
}

type Step = "input" | "checking" | "result" | "adding" | "added";

/**
 * Extract the info_hash from a magnet URI.
 * The hash appears right after `urn:btih:` and ends at `&` or end-of-string.
 */
function extractHash(magnet: string): string | null {
  const match = magnet.match(/urn:btih:([a-fA-F0-9]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/** Extract multiple hashes from multiple magnet links (one per line). */
function extractHashes(text: string): { hash: string; magnet: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("magnet:"))
    .map((magnet) => {
      const hash = extractHash(magnet);
      return hash ? { hash, magnet } : null;
    })
    .filter(Boolean) as { hash: string; magnet: string }[];
}

interface TorrentCheckerProps {
  hasAccounts: boolean;
  accounts?: any[];
}

export function TorrentChecker({ hasAccounts, accounts = [] }: TorrentCheckerProps) {
  const { activeAccountId } = useFileStore();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<CheckMode>("single");
  const [magnetInput, setMagnetInput] = useState("");
  const [results, setResults] = useState<Record<string, CachedTorrentResult | null>>({});
  const [magnetMap, setMagnetMap] = useState<Record<string, string>>({});
  const [addingHash, setAddingHash] = useState<string | null>(null);
  const [addedHashes, setAddedHashes] = useState<Set<string>>(new Set());
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  useEffect(() => {
    if (selectedAccountIds.length === 0) {
      if (activeAccountId) {
        setSelectedAccountIds([activeAccountId]);
      } else if (accounts.length > 0) {
        setSelectedAccountIds([accounts[0].id]);
      }
    }
  }, [activeAccountId, accounts, selectedAccountIds]);

  const reset = useCallback(() => {
    setStep("input");
    setMagnetInput("");
    setResults({});
    setMagnetMap({});
    setAddingHash(null);
    setAddedHashes(new Set());
    setExpandedHash(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Delay reset so the dialog close animation finishes
    setTimeout(reset, 200);
  }, [reset]);

  const handleCheck = useCallback(async () => {
    if (!magnetInput.trim()) {
      toast.error("Please paste a magnet link");
      return;
    }

    setStep("checking");

    try {
      if (mode === "single") {
        const hash = extractHash(magnetInput.trim());
        if (!hash) {
          toast.error("Could not extract hash from magnet link");
          setStep("input");
          return;
        }

        setMagnetMap({ [hash]: magnetInput.trim() });

        const checkAccountId = activeAccountId || accounts?.[0]?.id;
        if (!checkAccountId) {
          toast.error("No account available for checking cache");
          setStep("input");
          return;
        }

        const params = new URLSearchParams({ hash });
        params.set("account_id", checkAccountId.toString());

        const res = await fetch(`/api/torrent/check-cache?${params}`);
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.detail || "Failed to check cache");
        }

        // data.data is Record<hash, info | null>
        const info = data.data?.[hash] || null;
        setResults({ [hash]: info });
      } else {
        // Bulk mode
        const entries = extractHashes(magnetInput);
        if (entries.length === 0) {
          toast.error("Could not extract any valid magnet links");
          setStep("input");
          return;
        }

        const newMagnetMap: Record<string, string> = {};
        const hashes = entries.map(({ hash, magnet }) => {
          newMagnetMap[hash] = magnet;
          return hash;
        });
        setMagnetMap(newMagnetMap);

        const checkAccountId = activeAccountId || accounts?.[0]?.id;
        if (!checkAccountId) {
          toast.error("No account available for checking cache");
          setStep("input");
          return;
        }

        const res = await fetch("/api/torrent/check-cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hashes,
            account_id: checkAccountId,
          }),
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.detail || "Failed to check cache");
        }

        // Build results map — any hash not in data.data is not cached
        const resultMap: Record<string, CachedTorrentResult | null> = {};
        for (const hash of hashes) {
          resultMap[hash] = data.data?.[hash] || null;
        }
        setResults(resultMap);
      }

      setStep("result");
    } catch (error) {
      console.error("Cache check error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to check cache");
      setStep("input");
    }
  }, [magnetInput, mode, activeAccountId, accounts]);

  const handleAddTorrent = useCallback(
    async (hash: string) => {
      const magnet = magnetMap[hash];
      if (!magnet) {
        toast.error("Magnet link not found for this hash");
        return;
      }

      setAddingHash(hash);

      try {
        if (selectedAccountIds.length === 0) {
          toast.error("Please select at least one account");
          return;
        }

        // Grab the cached file list from the cache-check results
        const cachedInfo = results[hash];
        const cachedFiles = cachedInfo?.files || [];

        let totalInserted = 0;
        for (const accountId of selectedAccountIds) {
          const res = await fetch("/api/torrent/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              magnet,
              account_id: accountId,
              cached_files: cachedFiles,
              torrent_hash: hash,
            }),
          });

          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || data.detail || `Failed to add torrent to account ${accountId}`);
          }
          totalInserted += data.files_inserted || 0;
        }

        setAddedHashes((prev) => new Set(prev).add(hash));

        if (totalInserted > 0) {
          toast.success(`Torrent added! ${totalInserted} file${totalInserted > 1 ? "s" : ""} indexed across selected accounts.`);
        } else {
          toast.success("Torrent added to selected accounts!");
        }

        // Lightweight refresh — just re-read from DB, no full TorBox API re-sync
        window.dispatchEvent(new CustomEvent("torrent-files-updated"));
      } catch (error) {
        console.error("Add torrent error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to add torrent");
      } finally {
        setAddingHash(null);
      }
    },
    [magnetMap, selectedAccountIds, results]
  );


  const cachedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  if (!hasAccounts) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center p-2 rounded-full shadow-lg border border-primary/20 bg-primary text-primary-foreground hover:shadow-primary/25 hover:shadow-xl active:scale-95 transition-shadow duration-300 cursor-pointer overflow-hidden group"
        id="torrent-checker-fab"
        initial="initial"
        whileHover="hovered"
      >
        <Plus size={20} className="shrink-0 group-hover:rotate-90 transition-transform duration-300" />
        <motion.span
          className="whitespace-nowrap overflow-hidden font-medium text-sm flex items-center"
          variants={{
            initial: { width: 0, opacity: 0, marginLeft: 0 },
            hovered: { width: "auto", opacity: 1, marginLeft: 8, marginRight: 4 }
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          Check / Add Torrent
        </motion.span>
      </motion.button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Magnet size={20} className="text-primary" />
              Torrent Cache Checker
            </DialogTitle>
            <DialogDescription>
              Check if a torrent is cached on TorBox and optionally add it to your account.
            </DialogDescription>
          </DialogHeader>

          {/* Step: Input */}
          {step === "input" && (
            <div className="flex flex-col gap-4 py-2">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40 self-start">
                <button
                  onClick={() => setMode("single")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${mode === "single"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Single
                </button>
                <button
                  onClick={() => setMode("bulk")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${mode === "bulk"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Bulk
                </button>
              </div>



              <div className="relative">
                <textarea
                  value={magnetInput}
                  onChange={(e) => setMagnetInput(e.target.value)}
                  placeholder={
                    mode === "single"
                      ? "Paste your magnet link here..."
                      : "Paste multiple magnet links (one per line)..."
                  }
                  className="w-full min-h-30 p-3 pr-10 rounded-xl bg-muted/30 border border-border/50 text-sm font-mono placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  autoFocus
                />
                {magnetInput && (
                  <button
                    onClick={() => setMagnetInput("")}
                    className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {mode === "bulk" && magnetInput && (
                <p className="text-xs text-muted-foreground">
                  {extractHashes(magnetInput).length} valid magnet link(s) detected
                </p>
              )}

              <Button
                onClick={handleCheck}
                disabled={!magnetInput.trim()}
                className="w-full gap-2 rounded-xl font-semibold cursor-pointer"
              >
                <HardDrive size={16} />
                Check Cache
              </Button>
            </div>
          )}

          {/* Step: Checking */}
          {step === "checking" && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Checking cache...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Querying TorBox servers
                </p>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && (
            <div className="flex flex-col gap-3 py-2 overflow-y-auto max-h-[50vh] pr-1">
              {/* Summary bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                {cachedCount > 0 ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-400 shrink-0" />
                )}
                <span className="text-xs font-semibold flex-1">
                  {cachedCount} of {totalCount} torrent{totalCount > 1 ? "s" : ""} cached
                </span>
                {accounts && accounts.length > 1 && (
                  <div className="relative">
                    <select
                      multiple
                      size={1}
                      value={selectedAccountIds.map(String)}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                        setSelectedAccountIds(values);
                      }}
                      className="text-xs p-1 pr-6 rounded bg-background border border-border cursor-pointer focus:outline-none appearance-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.torbox_email}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                  </div>
                )}
              </div>

              {Object.entries(results).map(([hash, info]) => (
                <div
                  key={hash}
                  className="rounded-xl border border-border/50 overflow-hidden bg-card/50"
                >
                  {/* Torrent header */}
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() =>
                      setExpandedHash(expandedHash === hash ? null : hash)
                    }
                  >
                    <div className="mt-0.5 shrink-0">
                      {info ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <XCircle size={18} className="text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {info?.name || `Hash: ${hash.substring(0, 16)}...`}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {info && (
                          <span className="text-xs text-muted-foreground">
                            {formatBytes(info.size)} · {info.files.length} file
                            {info.files.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {!info && (
                          <span className="text-xs text-red-400/80">
                            Not cached on TorBox
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {info && !addedHashes.has(hash) && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTorrent(hash);
                          }}
                          disabled={addingHash === hash}
                          className="h-8 gap-1.5 text-xs rounded-lg font-semibold cursor-pointer"
                        >
                          {addingHash === hash ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Plus size={13} />
                          )}
                          Add
                        </Button>
                      )}
                      {addedHashes.has(hash) && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                          <CheckCircle2 size={14} />
                          Added
                        </span>
                      )}
                      {info && info.files.length > 0 && (
                        <span className="text-muted-foreground/50">
                          {expandedHash === hash ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded file list */}
                  {expandedHash === hash && info && info.files.length > 0 && (
                    <div className="border-t border-border/40 bg-muted/10 px-3 py-2 space-y-1.5">
                      {info.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 py-1 text-xs"
                        >
                          {file.mimetype.startsWith("video/") ? (
                            <FileVideo
                              size={14}
                              className="text-primary/70 shrink-0"
                            />
                          ) : (
                            <FileText
                              size={14}
                              className="text-muted-foreground/70 shrink-0"
                            />
                          )}
                          <span className="truncate flex-1 text-foreground/80">
                            {file.short_name}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          {step === "result" && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={reset}
                className="rounded-xl cursor-pointer"
              >
                Check Another
              </Button>
              <Button
                onClick={handleClose}
                className="rounded-xl cursor-pointer"
              >
                Done
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
