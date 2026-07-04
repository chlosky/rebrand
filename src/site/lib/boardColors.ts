export type BoardColorId =
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
  BoardColorId,
  { id: BoardColorId; label: string; swatch: string }
> = {
  rose_gold: { id: "rose_gold", label: "Rose Gold", swatch: "#E8B4B8" },
  light_pink: { id: "light_pink", label: "Light Pink", swatch: "#F8BBD0" },
  neon_pink: { id: "neon_pink", label: "Neon Pink", swatch: "#FF4DA6" },
  sky_blue: { id: "sky_blue", label: "Sky Blue", swatch: "#87CEEB" },
  red: { id: "red", label: "Red", swatch: "#E63946" },
  yellow: { id: "yellow", label: "Yellow", swatch: "#FFD93D" },
  green: { id: "green", label: "Green", swatch: "#3CB371" },
  light_green: { id: "light_green", label: "Light Green", swatch: "#98FB98" },
  blue: { id: "blue", label: "Blue", swatch: "#2563EB" },
  orange: { id: "orange", label: "Orange", swatch: "#FF8C42" },
  clear: {
    id: "clear",
    label: "Clear",
    swatch: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(200,220,235,0.35) 100%)",
  },
  white_opaque: { id: "white_opaque", label: "White", swatch: "#F0F0F0" },
  black_opaque: { id: "black_opaque", label: "Black", swatch: "#1C1C1C" },
};

/** Supplier chart order — all 13 colors on every page. */
export const ALL_BOARD_COLOR_IDS: BoardColorId[] = [
  "rose_gold",
  "light_pink",
  "neon_pink",
  "sky_blue",
  "red",
  "yellow",
  "green",
  "light_green",
  "blue",
  "orange",
  "clear",
  "white_opaque",
  "black_opaque",
];
