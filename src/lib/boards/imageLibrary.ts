import type { BoardImageAsset } from "@/lib/boards/types";

export const BOARD_IMAGE_THEMES = [
  "Identity",
  "Career & Money",
  "Love & Relationships",
  "Home & Space",
  "Beauty & Wellness",
  "Travel & Adventure",
  "Organization & Plan",
  "Aesthetic & Mood",
] as const;

export type BoardImageTheme = (typeof BOARD_IMAGE_THEMES)[number];

/** Maps affirmation-library categories into board-relevant themes. */
const CATEGORY_TO_THEME: Record<string, BoardImageTheme> = {
  Education: "Career & Money",
  Home: "Home & Space",
  Mentality: "Identity",
  Relationships: "Love & Relationships",
  Travel: "Travel & Adventure",
  Wealth: "Career & Money",
  "Wellness & Beauty": "Beauty & Wellness",
};

let cachedManifest: BoardImageAsset[] | null = null;

export async function loadBoardImageLibrary(): Promise<BoardImageAsset[]> {
  if (cachedManifest) return cachedManifest;

  const response = await fetch("/boardimagelibrary/manifest.json", { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Failed to load board image library");
  }
  const manifest = await response.json();
  cachedManifest = (manifest.images ?? []) as BoardImageAsset[];
  return cachedManifest;
}

export function themesFromLibrary(images: BoardImageAsset[]): BoardImageTheme[] {
  const set = new Set(images.map((i) => i.theme as BoardImageTheme));
  return BOARD_IMAGE_THEMES.filter((t) => set.has(t));
}

export function filterLibraryByTheme(images: BoardImageAsset[], theme: string | null): BoardImageAsset[] {
  if (!theme) return images;
  return images.filter((i) => i.theme === theme);
}

/** Build board manifest entries from affirmation library manifest shape. */
export function mapAffirmationManifestToBoardAssets(
  images: { id: string; category: string; url: string; description: string }[],
): BoardImageAsset[] {
  return images.map((img) => ({
    id: `board-${img.id}`,
    theme: CATEGORY_TO_THEME[img.category] ?? "Aesthetic & Mood",
    category: img.category,
    url: img.url,
    description: img.description,
    tags: [img.category.toLowerCase()],
  }));
}
