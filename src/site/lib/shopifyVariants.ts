import type { BoardColorId } from "@/site/lib/boardPageVariants";

export const SHOPIFY_STORE = "paletteplot.myshopify.com";

/** Empty cart page — always myshopify.com (never a custom subdomain without DNS). */
export const SHOPIFY_CART_URL = `https://${SHOPIFY_STORE}/cart`;

/** Shopify customer account — use myshopify.com so paletteplotting.com/account does not hit the SPA. */
export const SHOPIFY_ACCOUNT_LOGIN_URL = `https://${SHOPIFY_STORE}/account/login`;
export const SHOPIFY_ACCOUNT_URL = `https://${SHOPIFY_STORE}/account`;

export type StandoffId = "silver" | "gold";

export const STANDOFF_OPTIONS: Array<{ id: StandoffId; label: string }> = [
  { id: "silver", label: "Silver" },
  { id: "gold", label: "Gold" },
];

export type BoardSizeId = "12x24" | "18x24" | "24x36";

export type BoardSizeOption = {
  id: BoardSizeId;
  label: string;
  /** Set after Shopify variants exist and prices are confirmed. */
  priceUsd: number | null;
  priceLabel: string | null;
  checkoutEnabled: boolean;
};

/** Site size labels — mapped to Shopify Size option (option3). */
export const BOARD_SIZE_OPTIONS: BoardSizeOption[] = [
  {
    id: "12x24",
    label: "12×24",
    priceUsd: 99.99,
    priceLabel: "$99.99",
    checkoutEnabled: true,
  },
  {
    id: "18x24",
    label: "18×24",
    priceUsd: 139.99,
    priceLabel: "$139.99",
    checkoutEnabled: true,
  },
  {
    id: "24x36",
    label: "24×36",
    priceUsd: 199.99,
    priceLabel: "$199.99",
    checkoutEnabled: true,
  },
];

export const DEFAULT_BOARD_SIZE: BoardSizeId = "24x36";

export function boardSizeOption(size: BoardSizeId): BoardSizeOption {
  const option = BOARD_SIZE_OPTIONS.find((entry) => entry.id === size);
  if (!option) {
    throw new Error(`Unknown board size: ${size}`);
  }
  return option;
}

export function boardPriceForSize(size: BoardSizeId): number {
  return boardSizeOption(size).priceUsd ?? 199.99;
}

export function boardPriceLabelForSize(size: BoardSizeId): string {
  const option = boardSizeOption(size);
  return option.priceLabel ?? option.label;
}

/** Shopify variant IDs — Size × Standoffs × Board Color (78 total). */
export const SHOPIFY_VARIANTS: Record<
  BoardSizeId,
  Record<StandoffId, Record<BoardColorId, string>>
> = {
  "12x24": {
    silver: {
      rose_gold: "43986425774167",
      neon_pink: "43986426855511",
      light_pink: "43986426888279",
      yellow: "43986426921047",
      blue: "43986426953815",
      sky_blue: "43986426986583",
      black_opaque: "43986427019351",
      white_opaque: "43986427052119",
      clear: "43986427084887",
      orange: "43986427117655",
      green: "43986427150423",
      light_green: "43986427183191",
      red: "43986427215959",
    },
    gold: {
      rose_gold: "43986425806935",
      neon_pink: "43986427248727",
      light_pink: "43986427281495",
      yellow: "43986427314263",
      blue: "43986427347031",
      sky_blue: "43986427379799",
      black_opaque: "43986427412567",
      white_opaque: "43986427445335",
      clear: "43986427478103",
      orange: "43986427510871",
      green: "43986427543639",
      light_green: "43986427576407",
      red: "43986427609175",
    },
  },
  "18x24": {
    silver: {
      rose_gold: "43995641643095",
      neon_pink: "43995641774167",
      light_pink: "43995641905239",
      yellow: "43995642036311",
      blue: "43995642167383",
      sky_blue: "43995642298455",
      black_opaque: "43995642429527",
      white_opaque: "43995642560599",
      clear: "43995642691671",
      orange: "43995642822743",
      green: "43995642953815",
      light_green: "43995643084887",
      red: "43995643215959",
    },
    gold: {
      rose_gold: "43995641708631",
      neon_pink: "43995641839703",
      light_pink: "43995641970775",
      yellow: "43995642101847",
      blue: "43995642232919",
      sky_blue: "43995642363991",
      black_opaque: "43995642495063",
      white_opaque: "43995642626135",
      clear: "43995642757207",
      orange: "43995642888279",
      green: "43995643019351",
      light_green: "43995643150423",
      red: "43995643281495",
    },
  },
  "24x36": {
    silver: {
      rose_gold: "43995641675863",
      neon_pink: "43995641806935",
      light_pink: "43995641938007",
      yellow: "43995642069079",
      blue: "43995642200151",
      sky_blue: "43995642331223",
      black_opaque: "43995642462295",
      white_opaque: "43995642593367",
      clear: "43995642724439",
      orange: "43995642855511",
      green: "43995642986583",
      light_green: "43995643117655",
      red: "43995643248727",
    },
    gold: {
      rose_gold: "43995641741399",
      neon_pink: "43995641872471",
      light_pink: "43995642003543",
      yellow: "43995642134615",
      blue: "43995642265687",
      sky_blue: "43995642396759",
      black_opaque: "43995642527831",
      white_opaque: "43995642658903",
      clear: "43995642789975",
      orange: "43995642921047",
      green: "43995643052119",
      light_green: "43995643183191",
      red: "43995643314263",
    },
  },
};

export function shopifyCartUrl(variantId: string, quantity: number): string {
  const qty = Math.min(10, Math.max(1, quantity));
  return `https://${SHOPIFY_STORE}/cart/${variantId}:${qty}`;
}

export function shopifyVariantId(
  size: BoardSizeId,
  standoff: StandoffId,
  color: BoardColorId,
): string | null {
  const variantId = SHOPIFY_VARIANTS[size][standoff][color];
  return variantId || null;
}

export function isBoardVariantConfigured(
  size: BoardSizeId,
  standoff: StandoffId,
  color: BoardColorId,
): boolean {
  return Boolean(shopifyVariantId(size, standoff, color));
}

/** Standalone palette plotting Guide — Shopify variant ID. */
export const SHOPIFY_GUIDE_VARIANT_ID =
  import.meta.env.VITE_SHOPIFY_GUIDE_VARIANT_ID?.trim() || "43995101003863";

export function boardSelectionFromVariantId(variantId: string): {
  size: BoardSizeId;
  standoff: StandoffId;
  color: BoardColorId;
} | null {
  for (const size of Object.keys(SHOPIFY_VARIANTS) as BoardSizeId[]) {
    const standoffs = SHOPIFY_VARIANTS[size];
    for (const standoff of Object.keys(standoffs) as StandoffId[]) {
      const colors = standoffs[standoff];
      for (const color of Object.keys(colors) as BoardColorId[]) {
        if (colors[color] === variantId) {
          return { size, standoff, color };
        }
      }
    }
  }
  return null;
}
