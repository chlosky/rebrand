// Local (localStorage) cart for physical boards + Stripe Checkout handoff.
// Replaces the Shopify Storefront cart. Prices/labels are always derived from the
// catalog at read time; only size/standoff/color/quantity are persisted.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { BOARD_COLORS, type BoardColorId } from "@/site/lib/boardColors";
import { boardColorCatalogSrc } from "@/site/lib/boardColorCatalog";
import {
  boardPriceForSize,
  boardSizeOption,
  type BoardSizeId,
  type StandoffId,
} from "@/site/lib/shopifyVariants";

const CART_STORAGE_KEY = "pp_board_cart";
export const CART_UPDATED_EVENT = "palette-plot-cart-updated";

const CREATE_BOARD_CHECKOUT_URL = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/create-board-checkout`;

export type StoredCartLine = {
  size: BoardSizeId;
  standoff: StandoffId;
  color: BoardColorId;
  quantity: number;
};

export type BoardCartLine = StoredCartLine & {
  id: string;
  title: string;
  colorLabel: string;
  sizeLabel: string;
  standoffLabel: string;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
};

function lineId(line: StoredCartLine): string {
  return `${line.size}:${line.standoff}:${line.color}`;
}

function readStored(): StoredCartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is StoredCartLine =>
          l &&
          typeof l.size === "string" &&
          typeof l.standoff === "string" &&
          typeof l.color === "string" &&
          Number.isFinite(l.quantity),
      )
      .map((l) => ({
        size: l.size,
        standoff: l.standoff,
        color: l.color,
        quantity: Math.min(10, Math.max(1, Math.floor(l.quantity))),
      }));
  } catch {
    return [];
  }
}

function writeStored(lines: StoredCartLine[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Ignore storage failures.
  }
  notifyCartUpdated(lines);
}

function notifyCartUpdated(lines: StoredCartLine[]): void {
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { totalQuantity } }));
}

function decorate(line: StoredCartLine): BoardCartLine {
  const unitPrice = boardPriceForSize(line.size);
  return {
    ...line,
    id: lineId(line),
    title: BOARD_COLORS[line.color]?.label ?? "Acrylic board",
    colorLabel: BOARD_COLORS[line.color]?.label ?? line.color,
    sizeLabel: boardSizeOption(line.size).label,
    standoffLabel: line.standoff.charAt(0).toUpperCase() + line.standoff.slice(1),
    unitPrice,
    lineTotal: unitPrice * line.quantity,
    imageUrl: boardColorCatalogSrc(line.color),
  };
}

export function readBoardCart(): BoardCartLine[] {
  return readStored().map(decorate);
}

export function boardCartQuantity(): number {
  return readStored().reduce((sum, l) => sum + l.quantity, 0);
}

export function boardCartSubtotal(): number {
  return readBoardCart().reduce((sum, l) => sum + l.lineTotal, 0);
}

export function addBoardToCart(line: StoredCartLine): void {
  const lines = readStored();
  const id = lineId(line);
  const existing = lines.find((l) => lineId(l) === id);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + line.quantity);
  } else {
    lines.push({ ...line, quantity: Math.min(10, Math.max(1, line.quantity)) });
  }
  writeStored(lines);
}

export function updateBoardLineQuantity(id: string, quantity: number): void {
  let lines = readStored();
  if (quantity < 1) {
    lines = lines.filter((l) => lineId(l) !== id);
  } else {
    const target = lines.find((l) => lineId(l) === id);
    if (target) target.quantity = Math.min(10, Math.max(1, quantity));
  }
  writeStored(lines);
}

export function removeBoardLine(id: string): void {
  writeStored(readStored().filter((l) => lineId(l) !== id));
}

export function clearBoardCart(): void {
  writeStored([]);
}

/** Create a Stripe Checkout session for the cart and return its URL. */
export async function startBoardCheckout(email?: string): Promise<string> {
  const lines = readStored();
  if (lines.length === 0) throw new Error("Your cart is empty.");

  const response = await fetch(CREATE_BOARD_CHECKOUT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      lines: lines.map(({ size, standoff, color, quantity }) => ({ size, standoff, color, quantity })),
      ...(email ? { email } : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Could not open checkout. Please try again.");
  }
  return data.url;
}
