const MOBILE_BREAKPOINT = 768;

export type MarketingViewportDebugPayload = {
  buildSha: string;
  innerWidth: number;
  clientWidth: number;
  visualViewportWidth: number | null;
  visualViewportScale: number | null;
  devicePixelRatio: number;
  isMobileHook: boolean;
  isMobileBreakpoint: boolean;
  assetJs: string | null;
  assetCss: string | null;
  viewportMeta: string | null;
  userAgent: string;
};

export function shouldLogMarketingViewportDebug(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug") === "viewport" || params.has("debug_viewport");
}

/** Log viewport + asset parity info when ?debug=viewport is in the URL. */
export function logMarketingViewportDebug(isMobileHook: boolean): MarketingViewportDebugPayload | null {
  if (!shouldLogMarketingViewportDebug()) return null;

  const vv = window.visualViewport;
  const moduleScript = document.querySelector('script[type="module"]');
  const cssLink = document.querySelector('link[rel="stylesheet"]');

  const payload: MarketingViewportDebugPayload = {
    buildSha: import.meta.env.VITE_BUILD_SHA ?? "unknown",
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv?.width ?? null,
    visualViewportScale: vv?.scale ?? null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileHook,
    isMobileBreakpoint: window.innerWidth < MOBILE_BREAKPOINT,
    assetJs: moduleScript?.getAttribute("src") ?? null,
    assetCss: cssLink?.getAttribute("href") ?? null,
    viewportMeta:
      document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
    userAgent: navigator.userAgent,
  };

  console.info("[paletteplotting viewport debug]", payload);
  return payload;
}
