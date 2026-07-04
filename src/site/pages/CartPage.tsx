import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { SITE_CONTAINER } from "@/site/lib/siteBrand";
import { Button } from "@/site/components/ui/button";
import {
  flushAnalyticsBeforeCheckout,
  trackGABeginCheckout,
  trackMetaInitiateCheckout,
  trackTikTokInitiateCheckout,
} from "@/site/lib/analytics";
import { DEFAULT_PRODUCT_PATH } from "@/site/lib/boardPageVariants";
import { pageTitle } from "@/site/lib/siteBrand";
import {
  CART_UPDATED_EVENT,
  cartLineLabel,
  fetchCart,
  isUsableCheckoutUrl,
  removeCartLine,
  resolveCheckoutUrl,
  updateCartLineQuantity,
  type CartLine,
  type CartState,
} from "@/site/lib/shopifyStorefront";
import { usePageSeo } from "@/site/lib/usePageSeo";
import { cn } from "@/site/lib/utils";

function formatMoney(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function lineLabel(line: CartLine): string {
  return cartLineLabel(line);
}

export default function CartPage() {
  usePageSeo({
    title: pageTitle("Cart"),
    description: "Review items in your cart before checkout.",
    path: "/cart",
  });

  const [cart, setCart] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  const loadCart = useCallback(async () => {
    setError(null);
    try {
      const next = await fetchCart();
      setCart(next);
    } catch (err) {
      setCart(null);
      setError(err instanceof Error ? err.message : "Could not load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ totalQuantity: number }>).detail;
      if (!detail || detail.totalQuantity < 1) {
        setCart(null);
        return;
      }
      void loadCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, [loadCart]);

  const setQuantity = async (line: CartLine, quantity: number) => {
    if (busyLineId) return;
    setBusyLineId(line.id);
    setError(null);
    try {
      const next =
        quantity < 1
          ? await removeCartLine(line.id)
          : await updateCartLineQuantity(line.id, quantity);
      setCart(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart.");
    } finally {
      setBusyLineId(null);
    }
  };

  const handleCheckout = async () => {
    if (checkoutPending || !cart || cart.lines.length < 1) return;

    setCheckoutPending(true);
    setError(null);

    try {
      const checkoutUrl = resolveCheckoutUrl(cart.checkoutUrl);

      if (!isUsableCheckoutUrl(checkoutUrl)) {
        setError("Your cart is empty or checkout expired. Add the item again and try checkout.");
        setCheckoutPending(false);
        return;
      }

      const analyticsItems = cart.lines.map((line) => ({
        contentId: line.variantId,
        contentName: cartLineLabel(line),
        price: line.unitPrice,
        quantity: line.quantity,
      }));

      trackTikTokInitiateCheckout(analyticsItems);
      trackMetaInitiateCheckout(analyticsItems);
      trackGABeginCheckout(analyticsItems);

      await flushAnalyticsBeforeCheckout();

      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open checkout.");
      setCheckoutPending(false);
    }
  };

  const isEmpty = !loading && (!cart || cart.lines.length < 1);

  return (
    <SiteLayout>
      <div className={`${SITE_CONTAINER} py-8 sm:py-12`}>
        <header className="border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Cart
          </h1>
          {!isEmpty && cart ? (
            <p className="mt-2 text-sm text-neutral-600">
              {cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"}
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="mt-10 text-sm text-neutral-600">Loading your cart…</p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {isEmpty && !loading ? (
          <div className="mt-10 space-y-4">
            <p className="text-neutral-600">Your cart is empty.</p>
            <Link
              to={DEFAULT_PRODUCT_PATH}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Continue shopping
            </Link>
          </div>
        ) : null}

        {cart && cart.lines.length > 0 ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {cart.lines.map((line) => {
                const lineBusy = busyLineId === line.id;
                return (
                  <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 sm:h-28 sm:w-28">
                      {line.imageUrl ? (
                        <img
                          src={line.imageUrl}
                          alt={lineLabel(line)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900">{lineLabel(line)}</p>
                          <p className="mt-1 text-sm text-neutral-600">
                            {formatMoney(line.unitPrice, line.currencyCode)} each
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                          {formatMoney(line.lineTotal, line.currencyCode)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className="inline-flex items-center rounded-lg border border-neutral-300"
                          aria-label={`Quantity for ${lineLabel(line)}`}
                        >
                          <button
                            type="button"
                            disabled={lineBusy || line.quantity <= 1}
                            onClick={() => void setQuantity(line, line.quantity - 1)}
                            className="inline-flex h-9 w-9 items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" aria-hidden />
                          </button>
                          <span className="min-w-[2rem] px-2 text-center text-sm tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={lineBusy || line.quantity >= 10}
                            onClick={() => void setQuantity(line, line.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={lineBusy}
                          onClick={() => void setQuantity(line, 0)}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900",
                            lineBusy && "opacity-50",
                          )}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatMoney(cart.subtotal, cart.currencyCode)}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Shipping and taxes calculated at checkout.
              </p>
              <Button
                type="button"
                size="lg"
                className="mt-6 w-full rounded-xl"
                disabled={checkoutPending || busyLineId !== null}
                onClick={() => void handleCheckout()}
              >
                {checkoutPending ? "Opening checkout…" : "Checkout"}
              </Button>
              <Link
                to={DEFAULT_PRODUCT_PATH}
                className="mt-4 block text-center text-sm text-neutral-600 hover:text-neutral-900"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        ) : null}
      </div>
    </SiteLayout>
  );
}
