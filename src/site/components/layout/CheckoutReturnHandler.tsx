import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearStoredCart } from "@/site/lib/shopifyStorefront";

function isStaleShopifyCheckoutPath(pathname: string): boolean {
  return pathname.startsWith("/cart/c/") || pathname.startsWith("/checkouts/");
}

/**
 * Returning from Shopify checkout often restores a blank/stale SPA from bfcache.
 * Also clear headless cart if Shopify sends shoppers to checkout-style paths on paletteplot.com.
 */
export function CheckoutReturnHandler() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearStoredCart();
      window.location.reload();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    if (!isStaleShopifyCheckoutPath(pathname)) return;
    clearStoredCart();
    navigate("/", { replace: true });
  }, [pathname, navigate]);

  return null;
}
