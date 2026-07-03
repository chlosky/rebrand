/** Board accent colors — aligned with paletteplot.com acrylic catalog. */
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

export function boardFillForKey(key: string): string {
  const entry = BOARD_COLORS[key as BoardColorKey];
  return entry?.fill ?? "#FAFAFA";
}
