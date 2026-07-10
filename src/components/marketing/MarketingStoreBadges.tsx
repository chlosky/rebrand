import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";

type MarketingStoreBadgesProps = {
  getStoreHref?: (store: MobileWebStore) => string;
  onStoreClick?: (store: MobileWebStore) => void;
  className?: string;
  size?: "sm" | "lg";
  layout?: "wrap" | "inline";
  stores?: readonly MobileWebStore[];
  subline?: string;
};

export function MarketingStoreBadges({ className, size = "sm", layout = "wrap", subline }: MarketingStoreBadgesProps) {
  const badge = (
    <div
      className={cn(
        layout === "inline" ? "flex w-full items-center justify-center" : "flex flex-wrap items-center justify-center",
        size === "lg" ? "min-h-[52px]" : "min-h-[44px]",
        className,
      )}
      aria-label="palette plotting mobile app status"
    >
      <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
        Mobile app coming soon
      </div>
    </div>
  );

  if (!subline) return badge;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {badge}
      <p className="text-center text-sm font-semibold tracking-[-0.01em] text-[#e8b8cc]">{subline}</p>
    </div>
  );
}
