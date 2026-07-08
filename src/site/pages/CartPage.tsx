import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { SITE_CONTAINER } from "@/site/lib/siteBrand";
import { Button } from "@/site/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  clearBoardCart,
  readBoardCart,
  startBoardCheckout,
  updateBoardLineQuantity,
  type BoardCartLine,
} from "@/site/lib/boardCart";
import { usePageSeo } from "@/site/lib/usePageSeo";
import { cn } from "@/site/lib/utils";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function CartPage() {
  usePageSeo({
    title: pageTitle("Cart"),
    description: "Review items in your cart before checkout.",
    path: "/cart",
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lines, setLines] = useState<BoardCartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const orderStatus = searchParams.get("order");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPending, setSignupPending] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupNeedsConfirm, setSignupNeedsConfirm] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPending) return;
    setSignupPending(true);
    setSignupError(null);
    try {
      const email = signupEmail.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: signupPassword,
      });
      if (signUpError) throw signUpError;

      // Email confirmation may be required by project settings — no session returned.
      if (!data.session) {
        const { data: signIn } = await supabase.auth.signInWithPassword({
          email,
          password: signupPassword,
        });
        if (!signIn.session) {
          setSignupNeedsConfirm(true);
          return;
        }
      }
      navigate("/workspace");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setSignupPending(false);
    }
  };

  const refresh = useCallback(() => setLines(readBoardCart()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onCartUpdated = () => refresh();
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, [refresh]);

  useEffect(() => {
    if (orderStatus === "success") {
      clearBoardCart();
      setLines([]);
    }
  }, [orderStatus]);

  const setQuantity = (line: BoardCartLine, quantity: number) => {
    setError(null);
    updateBoardLineQuantity(line.id, quantity);
    refresh();
  };

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  const handleCheckout = async () => {
    if (checkoutPending || lines.length < 1) return;
    setCheckoutPending(true);
    setError(null);
    try {
      const analyticsItems = lines.map((line) => ({
        contentId: line.id,
        contentName: `${line.colorLabel} ${line.sizeLabel}`,
        price: line.unitPrice,
        quantity: line.quantity,
      }));
      trackTikTokInitiateCheckout(analyticsItems);
      trackMetaInitiateCheckout(analyticsItems);
      trackGABeginCheckout(analyticsItems);
      await flushAnalyticsBeforeCheckout();

      const url = await startBoardCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open checkout.");
      setCheckoutPending(false);
    }
  };

  if (orderStatus === "success") {
    return (
      <SiteLayout>
        <div className={`${SITE_CONTAINER} py-16`}>
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Order placed
            </h1>
            <p className="mx-auto mt-3 text-sm text-neutral-600">
              Thank you — your payment went through and your order is confirmed. You&apos;ll get a
              receipt by email, and we&apos;ll be in touch as it ships (1–3 business days
              processing).
            </p>
          </div>

          {signupNeedsConfirm ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
              <h2 className="text-lg font-semibold text-neutral-900">Almost there</h2>
              <p className="mt-2 text-sm text-neutral-600">
                We&apos;ve created your account. Check your inbox to confirm your email, then sign in
                to see your orders and Library.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-lg font-semibold text-neutral-900">Create your account</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Set up a free account to track this order and access your Library. Use the{" "}
                <span className="font-medium text-neutral-900">same email you checked out with</span>{" "}
                so your order links automatically.
              </p>
              <form onSubmit={(e) => void handleCreateAccount(e)} className="mt-5 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="text-sm font-medium text-neutral-800">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="text-sm font-medium text-neutral-800">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500"
                  />
                </div>
                {signupError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {signupError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl"
                  disabled={signupPending}
                >
                  {signupPending ? "Creating account…" : "Create account & continue"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-neutral-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to={DEFAULT_PRODUCT_PATH}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const isEmpty = lines.length < 1;

  return (
    <SiteLayout>
      <div className={`${SITE_CONTAINER} py-8 sm:py-12`}>
        <header className="border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">Cart</h1>
          {!isEmpty ? (
            <p className="mt-2 text-sm text-neutral-600">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </p>
          ) : null}
        </header>

        {orderStatus === "cancelled" ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Checkout was cancelled. Your cart is still here whenever you&apos;re ready.
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {isEmpty ? (
          <div className="mt-10 space-y-4">
            <p className="text-neutral-600">Your cart is empty.</p>
            <Link
              to={DEFAULT_PRODUCT_PATH}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 sm:h-28 sm:w-28">
                    <img src={line.imageUrl} alt={line.colorLabel} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">{line.colorLabel} acrylic board</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {line.sizeLabel} · {line.standoffLabel} standoffs
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {formatMoney(line.unitPrice)} each
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                        {formatMoney(line.lineTotal)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className="inline-flex items-center rounded-lg border border-neutral-300"
                        aria-label={`Quantity for ${line.colorLabel}`}
                      >
                        <button
                          type="button"
                          disabled={line.quantity <= 1}
                          onClick={() => setQuantity(line, line.quantity - 1)}
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
                          disabled={line.quantity >= 10}
                          onClick={() => setQuantity(line, line.quantity + 1)}
                          className="inline-flex h-9 w-9 items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuantity(line, 0)}
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Free US shipping · taxes (if any) shown at checkout.
              </p>
              <Button
                type="button"
                size="lg"
                className="mt-6 w-full rounded-xl"
                disabled={checkoutPending}
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
        )}
      </div>
    </SiteLayout>
  );
}
