import { productDisplayTitle, ALL_BOARD_COLOR_IDS, BOARD_COLORS, type BoardColorId } from "@/site/lib/boardPageVariants";
import {
  boardSelectionFromVariantId,
  SHOPIFY_STORE,
} from "@/site/lib/shopifyVariants";
import { replaceLegacyBrandName } from "@/site/lib/siteBrand";

const STOREFRONT_API_VERSION = "2026-04";
const CART_ID_STORAGE_KEY = "palette_plot_cart_id";
const CHECKOUT_URL_STORAGE_KEY = "palette_plot_checkout_url";
const CART_QTY_STORAGE_KEY = "palette_plot_cart_qty";
const LEGACY_CART_ID_STORAGE_KEY = "veligrid_cart_id";
const LEGACY_CHECKOUT_URL_STORAGE_KEY = "veligrid_checkout_url";
const LEGACY_CART_QTY_STORAGE_KEY = "veligrid_cart_qty";

function migrateLegacyStorageKeys(): void {
  const pairs: Array<[string, string]> = [
    [LEGACY_CART_ID_STORAGE_KEY, CART_ID_STORAGE_KEY],
    [LEGACY_CHECKOUT_URL_STORAGE_KEY, CHECKOUT_URL_STORAGE_KEY],
    [LEGACY_CART_QTY_STORAGE_KEY, CART_QTY_STORAGE_KEY],
  ];

  for (const [legacyKey, nextKey] of pairs) {
    try {
      const legacyValue = localStorage.getItem(legacyKey) ?? sessionStorage.getItem(legacyKey);
      if (legacyValue && !readStorage(nextKey)) {
        writeStorage(nextKey, legacyValue);
      }
      localStorage.removeItem(legacyKey);
      sessionStorage.removeItem(legacyKey);
    } catch {
      // Ignore storage failures.
    }
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

migrateLegacyStorageKeys();

export type CartResult = {
  checkoutUrl: string;
  totalQuantity: number;
};

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  title: string;
  productTitle: string;
  imageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
  currencyCode: string;
};

export type CartState = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  currencyCode: string;
  lines: CartLine[];
};

export const CART_UPDATED_EVENT = "palette-plot-cart-updated";

const CART_QUERY_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 50) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          image { url altText }
          price { amount currencyCode }
          product { title }
        }
      }
      cost {
        totalAmount { amount currencyCode }
      }
    }
  }
`;

function isShopifyCheckoutHost(hostname: string): boolean {
  return hostname === "checkout.shopify.com" || hostname.endsWith(".myshopify.com");
}

function isCartCheckoutPath(pathname: string): boolean {
  return pathname.startsWith("/cart/c/") || pathname.startsWith("/checkouts/");
}

/** True when URL is safe to send shoppers to for cart/checkout. */
export function isUsableCheckoutUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.hostname === "checkout.shopify.com") {
      return url.pathname.startsWith("/c/") && url.pathname.length > 3;
    }
    if (url.hostname.endsWith(".myshopify.com")) {
      if (url.pathname.startsWith("/cart/c/")) return true;
      if (url.pathname.startsWith("/checkouts/") && url.pathname.length > "/checkouts/".length) {
        return true;
      }
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Storefront checkout URLs must land on Shopify-hosted domains.
 * paletteplot.com / checkout.paletteplot.com are not Shopify — rewrite to myshopify.com.
 */
export function resolveCheckoutUrl(checkoutUrl: string): string {
  const trimmed = checkoutUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  let url: URL;
  try {
    if (trimmed.startsWith("//")) {
      url = new URL(`https:${trimmed}`);
    } else if (/^https?:\/\//i.test(trimmed)) {
      url = new URL(trimmed);
    } else {
      const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      url = new URL(path, `https://${SHOPIFY_STORE}`);
    }
  } catch {
    return trimmed;
  }

  if (url.hostname === "checkout.shopify.com") {
    return url.toString();
  }

  if (
    !isShopifyCheckoutHost(url.hostname) &&
    (isCartCheckoutPath(url.pathname) || url.pathname === "/cart")
  ) {
    url.hostname = SHOPIFY_STORE;
    url.protocol = "https:";
  }

  return url.toString();
}

function clearCachedCartSummary(): void {
  removeStorage(CHECKOUT_URL_STORAGE_KEY);
  removeStorage(CART_QTY_STORAGE_KEY);
}

function notifyCartUpdated(totalQuantity: number, checkoutUrl: string) {
  const resolvedCheckoutUrl = resolveCheckoutUrl(checkoutUrl);
  writeStorage(CHECKOUT_URL_STORAGE_KEY, resolvedCheckoutUrl);
  writeStorage(CART_QTY_STORAGE_KEY, String(totalQuantity));
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { totalQuantity, checkoutUrl: resolvedCheckoutUrl },
    }),
  );
}

export function getCachedCheckoutUrl(): string | null {
  const raw = readStorage(CHECKOUT_URL_STORAGE_KEY);
  if (!raw) return null;
  const resolved = resolveCheckoutUrl(raw);
  if (!isUsableCheckoutUrl(resolved)) {
    removeStorage(CHECKOUT_URL_STORAGE_KEY);
    return null;
  }
  return resolved;
}

export function getCachedCartQuantity(): number {
  const raw = readStorage(CART_QTY_STORAGE_KEY);
  const qty = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

type StorefrontGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type CartPayload = {
  cart: StorefrontCart | null;
  userErrors: Array<{ field: string[] | null; message: string }>;
};

type StorefrontCartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    image: { url: string; altText: string | null } | null;
    price: { amount: string; currencyCode: string };
    product: { title: string };
  };
  cost: {
    totalAmount: { amount: string; currencyCode: string };
  };
};

type StorefrontCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: {
    nodes: StorefrontCartLine[];
  };
};

function storefrontAccessToken(): string {
  const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Checkout is not configured yet. Add VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN in Cloudflare Pages build settings.",
    );
  }
  return token;
}

function variantGid(variantId: string): string {
  return `gid://shopify/ProductVariant/${variantId}`;
}

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `https://${SHOPIFY_STORE}/api/${STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken(),
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not reach Shopify checkout.");
  }

  const payload = (await response.json()) as StorefrontGraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Shopify checkout error.");
  }
  if (!payload.data) {
    throw new Error("Shopify checkout returned no data.");
  }

  return payload.data;
}

function readStoredCartId(): string | null {
  return readStorage(CART_ID_STORAGE_KEY);
}

function storeCartId(cartId: string): void {
  writeStorage(CART_ID_STORAGE_KEY, cartId);
}

function clearStoredCartId(): void {
  removeStorage(CART_ID_STORAGE_KEY);
}

function cartUserError(payload: { userErrors: CartPayload["userErrors"] }, fallback: string): never {
  const message = payload.userErrors[0]?.message;
  throw new Error(message ?? fallback);
}

function variantIdFromGid(gid: string): string {
  return gid.replace(/^gid:\/\/shopify\/ProductVariant\//, "");
}

function parseCartLine(line: StorefrontCartLine): CartLine | null {
  const merchandise = line.merchandise;
  if (!merchandise?.id) return null;

  return {
    id: line.id,
    quantity: line.quantity,
    variantId: variantIdFromGid(merchandise.id),
    title: replaceLegacyBrandName(merchandise.title),
    productTitle: replaceLegacyBrandName(merchandise.product.title),
    imageUrl: merchandise.image?.url ?? null,
    unitPrice: Number(merchandise.price.amount),
    lineTotal: Number(line.cost.totalAmount.amount),
    currencyCode: line.cost.totalAmount.currencyCode,
  };
}

function boardColorFromVariantTitle(variantTitle: string): BoardColorId | null {
  const segments = variantTitle.split("/").map((part) => part.trim());
  const colorCandidate = segments[segments.length - 1] ?? variantTitle.trim();

  for (const id of ALL_BOARD_COLOR_IDS) {
    if (BOARD_COLORS[id].label.toLowerCase() === colorCandidate.toLowerCase()) {
      return id;
    }
  }
  return null;
}

/** Site-facing cart line label — full Shopify title, board color at the end only. */
export function cartLineLabel(line: CartLine): string {
  const selection = boardSelectionFromVariantId(line.variantId);
  if (selection) {
    return productDisplayTitle(selection.color);
  }

  const colorFromTitle = line.title ? boardColorFromVariantTitle(line.title) : null;
  if (colorFromTitle) {
    return productDisplayTitle(colorFromTitle);
  }

  return replaceLegacyBrandName(line.productTitle);
}

function parseCart(cart: StorefrontCart): CartState {
  const lines = cart.lines.nodes
    .map(parseCartLine)
    .filter((line): line is CartLine => line !== null);

  return {
    id: cart.id,
    checkoutUrl: resolveCheckoutUrl(cart.checkoutUrl),
    totalQuantity: cart.totalQuantity,
    subtotal: Number(cart.cost.subtotalAmount.amount),
    currencyCode: cart.cost.subtotalAmount.currencyCode,
    lines,
  };
}

function syncCartStorage(cart: StorefrontCart): CartState {
  storeCartId(cart.id);
  const state = parseCart(cart);
  notifyCartUpdated(state.totalQuantity, state.checkoutUrl);
  return state;
}

function clearCartStorage(): void {
  clearStoredCartId();
  clearCachedCartSummary();
}

/** Clear headless cart after checkout or stale checkout URLs on the SPA. */
export function clearStoredCart(): void {
  clearCartStorage();
}

function cartFromPayload(payload: CartPayload, fallback: string): StorefrontCart {
  if (payload.userErrors.length > 0) {
    cartUserError(payload, fallback);
  }
  if (!payload.cart) {
    cartUserError(payload, fallback);
  }
  return payload.cart;
}

function formatCartError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error("Could not add to cart. Please try again.");
  }

  const message = error.message;
  const lower = message.toLowerCase();
  if (lower.includes("sold out") || lower.includes("out of stock")) {
    return new Error(
      "Shopify reported this item as unavailable. Refresh the page and try again — if it keeps happening, clear site data for paletteplot.com in your browser settings.",
    );
  }
  if (lower.includes("not configured")) {
    return error;
  }
  return error;
}

async function queryCart(cartId: string): Promise<CartState | null> {
  const data = await storefrontRequest<{ cart: StorefrontCart | null }>(
    `query cart($id: ID!) {
      cart(id: $id) {
        ${CART_QUERY_FIELDS}
      }
    }`,
    { id: cartId },
  );

  if (!data.cart || data.cart.totalQuantity < 1) {
    clearCartStorage();
    return null;
  }

  return syncCartStorage(data.cart);
}

/** Load the current Shopify cart with line items. */
export async function fetchCart(): Promise<CartState | null> {
  const cartId = readStoredCartId();
  if (!cartId) return null;

  try {
    return await queryCart(cartId);
  } catch {
    clearCartStorage();
    return null;
  }
}

/** Update quantity for a cart line (0 removes the line). */
export async function updateCartLineQuantity(
  lineId: string,
  quantity: number,
): Promise<CartState | null> {
  const cartId = readStoredCartId();
  if (!cartId) return null;

  const qty = Math.min(10, Math.max(0, quantity));
  const data = await storefrontRequest<{ cartLinesUpdate: CartPayload }>(
    `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_QUERY_FIELDS} }
        userErrors { field message }
      }
    }`,
    {
      cartId,
      lines: [{ id: lineId, quantity: qty }],
    },
  );

  const cart = cartFromPayload(data.cartLinesUpdate, "Could not update cart.");
  if (cart.totalQuantity < 1) {
    clearCartStorage();
    return null;
  }

  return syncCartStorage(cart);
}

/** Remove a line from the cart. */
export async function removeCartLine(lineId: string): Promise<CartState | null> {
  const cartId = readStoredCartId();
  if (!cartId) return null;

  const data = await storefrontRequest<{ cartLinesRemove: CartPayload }>(
    `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_QUERY_FIELDS} }
        userErrors { field message }
      }
    }`,
    { cartId, lineIds: [lineId] },
  );

  const cart = data.cartLinesRemove.cart;
  if (!cart || cart.totalQuantity < 1) {
    clearCartStorage();
    return null;
  }

  return syncCartStorage(cart);
}

async function createCart(variantId: string, quantity: number): Promise<CartResult> {
  const data = await storefrontRequest<{ cartCreate: CartPayload }>(
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ${CART_QUERY_FIELDS} }
        userErrors { field message }
      }
    }`,
    {
      input: {
        lines: [{ merchandiseId: variantGid(variantId), quantity }],
      },
    },
  );

  const state = syncCartStorage(cartFromPayload(data.cartCreate, "Could not create cart."));
  return { checkoutUrl: state.checkoutUrl, totalQuantity: state.totalQuantity };
}

async function addLinesToCart(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<CartResult> {
  const data = await storefrontRequest<{ cartLinesAdd: CartPayload }>(
    `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_QUERY_FIELDS} }
        userErrors { field message }
      }
    }`,
    {
      cartId,
      lines: [{ merchandiseId: variantGid(variantId), quantity }],
    },
  );

  const state = syncCartStorage(cartFromPayload(data.cartLinesAdd, "Could not update cart."));
  return { checkoutUrl: state.checkoutUrl, totalQuantity: state.totalQuantity };
}

/** Adds a variant to the Shopify cart and returns checkout URL for the header Cart link. */
export async function addVariantToCart(
  variantId: string,
  quantity: number,
): Promise<CartResult> {
  const qty = Math.min(10, Math.max(1, quantity));
  const existingCartId = readStoredCartId();

  if (existingCartId) {
    try {
      return await addLinesToCart(existingCartId, variantId, qty);
    } catch {
      clearCartStorage();
    }
  }

  try {
    return await createCart(variantId, qty);
  } catch (error) {
    throw formatCartError(error);
  }
}

/** Fresh checkout URL from the Storefront API cart. */
export async function getStoredCartCheckoutUrl(): Promise<string | null> {
  try {
    const cart = await fetchCart();
    return cart?.checkoutUrl ?? null;
  } catch {
    clearCartStorage();
    return null;
  }
}
