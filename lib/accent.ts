export const ACCENT_STORAGE_KEY = "relay-accent";

export interface AccentPreset {
  id: string;
  label: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "purple", label: "Purple", hex: "#8b5cf6" },
  { id: "blue", label: "Blue", hex: "#3b82f6" },
  { id: "golden", label: "Golden", hex: "#f59e0b" },
  { id: "green", label: "Green", hex: "#22c55e" },
  { id: "yellow", label: "Yellow", hex: "#eab308" },
  { id: "red", label: "Red", hex: "#ef4444" },
  { id: "pink", label: "Pink", hex: "#ec4899" },
  { id: "maroon", label: "Maroon", hex: "#9f1239" },
];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0].hex;

/** Accepts `#rgb` / `#rrggbb` and returns a normalized lowercase `#rrggbb` or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return null;
}

const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

/** WCAG relative luminance of a hex color (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex) || DEFAULT_ACCENT;
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

/** Pick readable foreground (near-black vs near-white) for a given accent hex. */
export function accentForeground(hex: string): string {
  return relativeLuminance(hex) > 0.4
    ? "oklch(0.2 0.02 250)"
    : "oklch(0.98 0.01 70)";
}

/** Apply an accent hex to the document's CSS variables, using the hex verbatim. */
export function applyAccent(hex: string): void {
  const normalized = normalizeHex(hex) || DEFAULT_ACCENT;
  const style = document.documentElement.style;
  style.setProperty("--primary", normalized);
  style.setProperty("--ring", normalized);
  style.setProperty("--primary-foreground", accentForeground(normalized));
}

/** Read the stored accent, falling back to the default. */
export function getStoredAccent(): string {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
  const hex = stored ? normalizeHex(stored) : null;
  return hex || DEFAULT_ACCENT;
}

export function storeAccent(hex: string): void {
  localStorage.setItem(ACCENT_STORAGE_KEY, hex);
}
