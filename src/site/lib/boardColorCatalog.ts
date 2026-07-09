/**
 * One product photo per board color for the home catalog grid (and default product heroes).
 *
 * Drop PNGs into `public/board/catalog/` using these filenames — replace placeholders anytime.
 */
import { ALL_BOARD_COLOR_IDS, BOARD_COLORS, type BoardColorId } from "@/site/lib/boardColors";

export type CatalogGalleryImage = { src: string; alt: string };

export const BOARD_COLOR_CATALOG_FILES: Record<BoardColorId, string> = {
  rose_gold: "rose-gold.png",
  light_pink: "light-pink.png",
  neon_pink: "neon-pink.png",
  sky_blue: "sky-blue.png",
  red: "red.png",
  yellow: "yellow.png",
  green: "green.png",
  light_green: "light-green.png",
  blue: "blue.png",
  orange: "orange.png",
  clear: "clear.png",
  white_opaque: "white.png",
  black_opaque: "black.png",
};

const CATALOG_DIR = "/board/catalog";

export function boardColorCatalogSrc(colorId: BoardColorId): string {
  return `${CATALOG_DIR}/${BOARD_COLOR_CATALOG_FILES[colorId]}`;
}

/** All 13 catalog image paths — order matches ALL_BOARD_COLOR_IDS / swatch chart. */
export const BOARD_COLOR_CATALOG_IMAGES: Record<BoardColorId, string> = Object.fromEntries(
  ALL_BOARD_COLOR_IDS.map((id) => [id, boardColorCatalogSrc(id)]),
) as Record<BoardColorId, string>;

/** Swatch-chart order — Rose Gold through Black. */
export function boardColorCatalogGalleryItems(): CatalogGalleryImage[] {
  return ALL_BOARD_COLOR_IDS.map((id) => ({
    src: boardColorCatalogSrc(id),
    alt: `${BOARD_COLORS[id].label} acrylic wall board`,
  }));
}

/** Lifestyle gallery first, then any catalog color shots not already shown. */
export function appendCatalogGalleryTail(base: CatalogGalleryImage[]): CatalogGalleryImage[] {
  const seen = new Set(base.map((item) => item.src));
  const tail = boardColorCatalogGalleryItems().filter((item) => !seen.has(item.src));
  return [...base, ...tail];
}

export const BOARD_COLOR_CATALOG_README = `
palette plotting color catalog — one PNG per color (replace any file to update the site):

  rose-gold.png      Rose Gold
  light-pink.png     Light Pink
  neon-pink.png      Neon Pink
  sky-blue.png       Sky Blue
  red.png            Red
  yellow.png         Yellow
  green.png          Green
  light-green.png    Light Green
  blue.png           Blue
  orange.png         Orange
  clear.png          Clear
  white.png          White
  black.png          Black

Used on: home page color grid + /dry-erase-boards product heroes.
`.trim();
