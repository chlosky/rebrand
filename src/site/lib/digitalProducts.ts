/** Client-safe digital platform constants — no grant rules or catalog metadata. */
export const PALETTE_PLOTTING_GUIDE_SLUG = "palette-plotting-guide";
export const PALETTE_PLOTTING_GUIDE_PATH = "/palette-plotting-guide";

export type DigitalAccessModel = "lifetime" | "subscription" | "rental";
export type DigitalDelivery = "reader" | "spa" | "external";

export type LibraryProductSummary = {
  slug: string;
  title: string;
  entryPath: string;
  previewPath: string | null;
  accessModel: DigitalAccessModel;
  delivery: DigitalDelivery;
  expiresAt: string | null;
};
