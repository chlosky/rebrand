import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MobileStoreFallbackSheet } from "@/components/marketing/MobileStoreFallbackSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getMobileWebStore,
  handleStoreClick,
  isDesktopMarketingWeb,
  shouldScheduleStoreFallback,
  type MobileWebStore,
  type StoreClickResult,
} from "@/lib/marketingGetApp";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scheduleStoreFallbackCheck, type StoreFallbackScheduleHandle } from "@/lib/mobileStoreFallbackScheduler";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type FallbackState = {
  store: MobileWebStore;
  storeUrl: string;
  source: string;
};

export type UseStoreCtaResult = {
  detection: InAppBrowserDetection;
  getStoreHref: (store: MobileWebStore) => string;
  primaryStoreHref: string;
  primaryStore: MobileWebStore;
  onStoreClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
  /** @deprecated use onStoreClick */
  onCtaClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
};

type ProviderState = UseStoreCtaResult & {
  fallbackOpen: boolean;
  fallbackState: FallbackState | null;
  closeFallback: () => void;
  tryAgain: () => void;
  copyStoreLink: () => Promise<boolean>;
};

const MarketingStoreCtaContext = createContext<UseStoreCtaResult | null>(null);

function useMarketingStoreCtaInternal(isMobileViewport: boolean): ProviderState {
  const [detection, setDetection] = useState<InAppBrowserDetection>(() => detectInAppBrowser());
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const fallbackTimerRef = useRef<StoreFallbackScheduleHandle | null>(null);

  useEffect(() => {
    const next = detectInAppBrowser();
    setDetection(next);
    logStoreHandoff("detection_ready", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      in_app_browser: next.kind ?? "none",
      blocks_app_store: next.blocksAppStore,
      platform: next.isIos ? "ios" : next.isAndroid ? "android" : "unknown",
    });
  }, []);

  const cancelFallbackTimer = useCallback((reason: string) => {
    fallbackTimerRef.current?.cancel(reason);
    fallbackTimerRef.current = null;
  }, []);

  const closeFallback = useCallback(() => {
    setFallbackOpen(false);
    setFallbackState(null);
  }, []);

  const openFallback = useCallback((state: FallbackState) => {
    setFallbackState(state);
    setFallbackOpen(true);
    trackMarketingConversion("in_app_prompt_shown", {
      source: state.source,
      store: state.store,
    });
    logStoreHandoff("fallback_sheet_opened", {
      source: state.source,
      store: state.store,
      storeUrl: state.storeUrl,
    });
  }, []);

  const scheduleFallback = useCallback(
    (store: MobileWebStore, source: string) => {
      if (!shouldScheduleStoreFallback(isMobileViewport, detection)) return;

      cancelFallbackTimer("reschedule");
      const copyUrl = getCopyableStoreUrl(store);

      fallbackTimerRef.current = scheduleStoreFallbackCheck({
        meta: { source, store },
        onShow: () => openFallback({ store, storeUrl: copyUrl, source }),
      });
    },
    [cancelFallbackTimer, detection, isMobileViewport, openFallback],
  );

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  const primaryStore = useMemo(
    () => getMobileWebStore() ?? ("apple" as MobileWebStore),
    [],
  );

  const primaryStoreHref = useMemo(
    () => getMobileStoreHref(primaryStore, detection),
    [detection, primaryStore],
  );

  const onStoreClick = useCallback(
    (source: string, forceStore?: MobileWebStore) => {
      const isDesktop = isDesktopMarketingWeb(isMobileViewport);
      const result = handleStoreClick({
        isMobileViewport,
        forceStore,
        source,
        detection,
        navigate: isDesktop,
      });

      if (!isDesktop && result.kind === "opened_store") {
        scheduleFallback(result.store, source);
      }

      return result;
    },
    [detection, isMobileViewport, scheduleFallback],
  );

  const tryAgain = useCallback(() => {
    if (!fallbackState) return;
    trackMarketingConversion("in_app_open_in_browser", {
      source: fallbackState.source,
      store: fallbackState.store,
      action: "try_again",
    });
    openMobileStoreViaAnchor(fallbackState.store, detection);
    scheduleFallback(fallbackState.store, fallbackState.source);
  }, [detection, fallbackState, scheduleFallback]);

  const copyStoreLink = useCallback(async (): Promise<boolean> => {
    if (!fallbackState) return false;
    try {
      await navigator.clipboard.writeText(fallbackState.storeUrl);
      trackMarketingConversion("in_app_copy_link", {
        source: fallbackState.source,
        store: fallbackState.store,
      });
      return true;
    } catch {
      return false;
    }
  }, [fallbackState]);

  useEffect(() => () => cancelFallbackTimer("unmount"), [cancelFallbackTimer]);

  return {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick: onStoreClick,
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
  };
}

export function MarketingStoreCtaProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const state = useMarketingStoreCtaInternal(isMobile);
  const {
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  } = state;

  const ctxValue: UseStoreCtaResult = {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  };

  return (
    <MarketingStoreCtaContext.Provider value={ctxValue}>
      {children}
      {!isDesktopMarketingWeb(isMobile) && fallbackState ? (
        <MobileStoreFallbackSheet
          open={fallbackOpen}
          store={fallbackState.store}
          storeUrl={fallbackState.storeUrl}
          browserKind={state.detection.kind}
          isIos={state.detection.isIos}
          onClose={closeFallback}
          onTryAgain={tryAgain}
          onCopy={copyStoreLink}
        />
      ) : null}
    </MarketingStoreCtaContext.Provider>
  );
}

export function useMarketingStoreCta(): UseStoreCtaResult {
  const ctx = useContext(MarketingStoreCtaContext);
  if (!ctx) {
    throw new Error("useMarketingStoreCta must be used within MarketingStoreCtaProvider");
  }
  return ctx;
}
