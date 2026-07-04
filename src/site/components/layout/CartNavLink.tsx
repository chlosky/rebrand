import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import {
  CART_UPDATED_EVENT,
  getCachedCartQuantity,
} from "@/site/lib/shopifyStorefront";
import { cn } from "@/site/lib/utils";

const navItemClass =
  "text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600";

export function CartNavLink() {
  const [quantity, setQuantity] = useState(() => getCachedCartQuantity());

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ totalQuantity: number }>).detail;
      if (detail) setQuantity(detail.totalQuantity);
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
  }, []);

  return (
    <NavLink
      to="/cart"
      className={({ isActive }) =>
        cn(
          navItemClass,
          "inline-flex items-center gap-1.5",
          isActive && "underline decoration-neutral-300 underline-offset-4",
        )
      }
      aria-label={quantity > 0 ? `Cart, ${quantity} items` : "View cart"}
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span>Cart</span>
      {quantity > 0 ? (
        <span className="tabular-nums text-neutral-500" aria-hidden>
          ({quantity})
        </span>
      ) : null}
    </NavLink>
  );
}
