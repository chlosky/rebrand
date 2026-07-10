/** Client-safe digital platform constants — no grant rules or catalog metadata. */
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export const PALETTE_PLOTTING_GUIDE_SLUG = "palette-plotting-guide";
export const PALETTE_PLOTTING_GUIDE_PATH = "/palette-plotting-guide";

/** localStorage key holding the HMAC guide session token issued by digital-unlock. */
export const GUIDE_TOKEN_STORAGE_KEY = "pp_guide_token";

const FUNCTIONS_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1`;
export const DIGITAL_UNLOCK_URL = `${FUNCTIONS_BASE}/digital-unlock`;
export const DIGITAL_SESSION_URL = `${FUNCTIONS_BASE}/digital-session`;
export const CREATE_GUIDE_CHECKOUT_URL = `${FUNCTIONS_BASE}/create-guide-checkout`;
export const GUIDE_READER_API_URL = `${FUNCTIONS_BASE}/palette-plotting-guide-reader`;

/** apikey required so the Supabase functions gateway routes the request. */
export const DIGITAL_FUNCTIONS_APIKEY = SUPABASE_PUBLISHABLE_KEY;

export function buildGuideReaderUrl(token: string, section = "start-here"): string {
  const params = new URLSearchParams({ token });
  return `/palette-plotting-guide/read/${section}?${params.toString()}`;
}

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
