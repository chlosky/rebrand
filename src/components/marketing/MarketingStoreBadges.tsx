import {
  APP_STORE_BADGE_WHITE_URL,
  GOOGLE_PLAY_BADGE_URL,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_APPLE_HEIGHT_PX,
  STORE_BADGE_APPLE_WIDTH_PX,
  STORE_BADGE_GOOGLE_HEIGHT_PX,
  STORE_BADGE_GOOGLE_WIDTH_PX,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";

type MarketingStoreBadgesProps = {
  /**
   * Native store href per badge (itms-apps / intent in in-app browsers).
   * When set, badges render as `<a>` tags so the WebView handles handoff.
   */
  getStoreHref?: (store: MobileWebStore) => string;
  /** Analytics / desktop routing — must not call preventDefault when used with getStoreHref. */
  onStoreClick?: (store: MobileWebStore) => void;
  className?: string;
  /** Primary placement (hero / download) — eager-loads badge images. */
  size?: "sm" | "lg";
  /** Side-by-side row, centered, no wrap (mobile hero / download). */
  layout?: "wrap" | "inline";
  /** Defaults to both stores; pass `["apple"]` for App Store only. */
  stores?: readonly MobileWebStore[];
  /** Optional line centered under the badge row (e.g. free-trial on homepage). */
  subline?: string;
};

const controlClass =
  "inline-flex shrink-0 items-center justify-center overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 outline-none appearance-none [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] hover:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:opacity-90";

const STORE_BADGE_LG_GOOGLE_HEIGHT_PX = 68;
const STORE_BADGE_LG_APPLE_HEIGHT_PX = Math.round(
  (STORE_BADGE_APPLE_HEIGHT_PX / STORE_BADGE_GOOGLE_HEIGHT_PX) * STORE_BADGE_LG_GOOGLE_HEIGHT_PX,
);
const STORE_BADGE_LG_APPLE_WIDTH_PX = Math.round(
  (250 / 83) * STORE_BADGE_LG_APPLE_HEIGHT_PX,
);
const STORE_BADGE_LG_GOOGLE_WIDTH_PX = Math.round(
  (646 / 250) * STORE_BADGE_LG_GOOGLE_HEIGHT_PX,
);

function badgeContainerClass(
  layout: MarketingStoreBadgesProps["layout"],
  size: MarketingStoreBadgesProps["size"],
  className?: string,
) {
  const fluidInline = layout === "inline" && size === "lg";
  return cn(
    fluidInline
      ? "flex w-full min-w-0 flex-nowrap items-center justify-center gap-2 sm:gap-3"
      : layout === "inline"
        ? "flex w-full flex-nowrap items-center justify-center gap-4 sm:gap-5"
        : "flex flex-wrap items-center justify-center gap-4 sm:gap-5",
    className,
  );
}

type BadgeControlProps = {
  store: MobileWebStore;
  getStoreHref?: (store: MobileWebStore) => string;
  onStoreClick?: (store: MobileWebStore) => void;
  priority?: boolean;
  size?: "sm" | "lg";
  fluid?: boolean;
};

function StoreBadgeControl({
  store,
  getStoreHref,
  onStoreClick,
  priority = false,
  size = "sm",
  fluid = false,
}: BadgeControlProps) {
  const isApple = store === "apple";
  const defaultHref = isApple ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
  const href = getStoreHref?.(store) ?? defaultHref;
  const displayWidth =
    size === "lg"
      ? isApple
        ? STORE_BADGE_LG_APPLE_WIDTH_PX
        : STORE_BADGE_LG_GOOGLE_WIDTH_PX
      : isApple
        ? STORE_BADGE_APPLE_WIDTH_PX
        : STORE_BADGE_GOOGLE_WIDTH_PX;
  const displayHeight =
    size === "lg"
      ? isApple
        ? STORE_BADGE_LG_APPLE_HEIGHT_PX
        : STORE_BADGE_LG_GOOGLE_HEIGHT_PX
      : isApple
        ? STORE_BADGE_APPLE_HEIGHT_PX
        : STORE_BADGE_GOOGLE_HEIGHT_PX;
  const rowHeight =
    size === "lg" ? STORE_BADGE_LG_GOOGLE_HEIGHT_PX : STORE_BADGE_ROW_HEIGHT_PX;

  const img = fluid ? (
    <img
      src={isApple ? APP_STORE_BADGE_WHITE_URL : GOOGLE_PLAY_BADGE_URL}
      alt={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className="block h-auto w-full max-w-none select-none object-contain object-center"
      width={displayWidth}
      height={displayHeight}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      draggable={false}
    />
  ) : (
    <img
      src={isApple ? APP_STORE_BADGE_WHITE_URL : GOOGLE_PLAY_BADGE_URL}
      alt={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className="block max-w-none shrink-0 select-none object-contain object-center"
      style={{
        width: displayWidth,
        height: displayHeight,
        maxWidth: displayWidth,
        maxHeight: rowHeight,
      }}
      width={displayWidth}
      height={displayHeight}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      draggable={false}
    />
  );

  const frameStyle = fluid
    ? undefined
    : {
        height: rowHeight,
        width: displayWidth,
        minWidth: displayWidth,
        flexShrink: 0,
      };
  const frameClass = fluid
    ? cn(controlClass, "min-w-0", isApple ? "w-[46%] shrink" : "w-[52%] shrink-0")
    : controlClass;
  const label = isApple ? "Download on the App Store" : "Get it on Google Play";

  if (getStoreHref) {
    return (
      <a
        href={href}
        className={frameClass}
        style={frameStyle}
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => onStoreClick?.(store)}
      >
        {img}
      </a>
    );
  }

  if (onStoreClick) {
    return (
      <button
        type="button"
        onClick={() => onStoreClick(store)}
        className={frameClass}
        style={frameStyle}
        aria-label={label}
      >
        {img}
      </button>
    );
  }

  return (
    <a
      href={defaultHref}
      className={frameClass}
      style={frameStyle}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={label}
    >
      {img}
    </a>
  );
}

export function MarketingStoreBadges({
  getStoreHref,
  onStoreClick,
  className,
  size = "sm",
  layout = "wrap",
  stores = ["apple", "google"],
  subline,
}: MarketingStoreBadgesProps) {
  const fluidInline = layout === "inline" && size === "lg";
  const containerClass = badgeContainerClass(
    layout,
    size,
    cn(
      fluidInline ? "min-h-[52px] sm:min-h-[60px]" : "min-h-[57px]",
      "items-center justify-center",
      className,
    ),
  );
  const priority = size === "lg";

  const badges = (
    <div className={containerClass} aria-label="Download Palette Plotting">
      {stores.includes("apple") ? (
        <StoreBadgeControl
          store="apple"
          getStoreHref={getStoreHref}
          onStoreClick={onStoreClick}
          priority={priority}
          size={size}
          fluid={fluidInline}
        />
      ) : null}
      {stores.includes("google") ? (
        <StoreBadgeControl
          store="google"
          getStoreHref={getStoreHref}
          onStoreClick={onStoreClick}
          priority={priority}
          size={size}
          fluid={fluidInline}
        />
      ) : null}
    </div>
  );

  if (!subline) return badges;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {badges}
      <p className="text-center text-sm font-semibold tracking-[-0.01em] text-[#e8b8cc]">{subline}</p>
    </div>
  );
}
