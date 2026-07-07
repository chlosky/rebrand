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

let cachedManifest: BoardImageAsset[] | null = null;

export function getCachedBoardImageLibrary(): BoardImageAsset[] | null {
  return cachedManifest;
}

export async function loadBoardImageLibrary(): Promise<BoardImageAsset[]> {
  if (cachedManifest) return cachedManifest;

  const response = await fetch("/boardimagelibrary/manifest.generated.json", { cache: "no-store" });
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
