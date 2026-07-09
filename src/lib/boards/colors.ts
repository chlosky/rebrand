/** Named board colors — templates, AI companion, and legacy rows. */
export type BoardColorKey =
  | "rose_gold"
  | "light_pink"
  | "neon_pink"
  | "sky_blue"
  | "red"
  | "yellow"
  | "green"
  | "light_green"
  | "blue"
  | "orange"
  | "clear"
  | "white_opaque"
  | "black_opaque";

export const BOARD_COLORS: Record<
  BoardColorKey,
  { key: BoardColorKey; label: string; swatch: string; fill: string }
> = {
  rose_gold: { key: "rose_gold", label: "Rose Gold", swatch: "#E8B4B8", fill: "#F5E1E3" },
  light_pink: { key: "light_pink", label: "Light Pink", swatch: "#F8BBD0", fill: "#FDE8F0" },
  neon_pink: { key: "neon_pink", label: "Neon Pink", swatch: "#FF4DA6", fill: "#FFE0F0" },
  sky_blue: { key: "sky_blue", label: "Sky Blue", swatch: "#87CEEB", fill: "#E3F4FC" },
  red: { key: "red", label: "Red", swatch: "#E63946", fill: "#FCE4E6" },
  yellow: { key: "yellow", label: "Yellow", swatch: "#FFD93D", fill: "#FFF8DC" },
  green: { key: "green", label: "Green", swatch: "#3CB371", fill: "#E0F5EA" },
  light_green: { key: "light_green", label: "Light Green", swatch: "#98FB98", fill: "#EDFCEB" },
  blue: { key: "blue", label: "Blue", swatch: "#2563EB", fill: "#E0EBFF" },
  orange: { key: "orange", label: "Orange", swatch: "#FF8C42", fill: "#FFE8D6" },
  clear: { key: "clear", label: "Clear", swatch: "#E8E8E8", fill: "#FAFAFA" },
  white_opaque: { key: "white_opaque", label: "White", swatch: "#F0F0F0", fill: "#FFFFFF" },
  black_opaque: { key: "black_opaque", label: "Black", swatch: "#1C1C1C", fill: "#F5F5F5" },
};

/** Quick picks in the Marks panel — full ROYGBIV plus useful neutrals. */
export const BOARD_QUICK_PICK_COLORS = [
  { label: "Red", hex: "#e53935" },
  { label: "Orange", hex: "#fb8c00" },
  { label: "Yellow", hex: "#fdd835" },
  { label: "Green", hex: "#43a047" },
  { label: "Blue", hex: "#1e88e5" },
  { label: "Indigo", hex: "#3949ab" },
  { label: "Violet", hex: "#8e24aa" },
  { label: "Rose", hex: "#ec407a" },
  { label: "Coral", hex: "#ff7043" },
  { label: "Lime", hex: "#c0ca33" },
  { label: "Teal", hex: "#00897b" },
  { label: "Cyan", hex: "#00acc1" },
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#1C1C1C" },
] as const;

export function normalizeBoardColorHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(withHash)) return null;
  const expanded =
    withHash.length === 4
      ? `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`
      : withHash;
  return expanded.toLowerCase();
}

export function boardFillForKey(key: string): string {
  const hex = normalizeBoardColorHex(key);
  if (hex) return hex;
  const entry = BOARD_COLORS[key as BoardColorKey];
  return entry?.fill.toLowerCase() ?? "#ffffff";
}

export function boardColorHexForKey(key: string): string {
  return boardFillForKey(key);
}
