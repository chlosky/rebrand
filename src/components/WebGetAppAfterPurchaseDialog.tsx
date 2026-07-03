import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import {
  preloadStoreBadgeImages,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isWebGetAppDialogPreviewMode,
  markWebGetAppPromptShown,
  shouldOfferWebGetAppPrompt,
} from "@/lib/webFirstPurchaseGetAppPrompt";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { cn } from "@/lib/utils";

const STORE_QRS = [
  {
    label: "App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code for the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code for Google Play",
  },
] as const;

function DesktopQrPair() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: 120,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
      {STORE_QRS.map((store) => (
        <div key={store.href} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.label}</span>
          {ready && qrByHref[store.href] ? (
            <a
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border bg-white p-2 shadow-sm"
            >
              <img
                src={qrByHref[store.href]}
                alt={store.alt}
                className="h-24 w-24"
                width={96}
                height={96}
              />
            </a>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
              aria-busy={!ready}
            >
              …
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One-time browser prompt after the user's first web subscription purchase.
 * Shown only off paywall/onboarding/post-paywall routes (e.g. dashboard).
 */
export function WebGetAppAfterPurchaseDialog() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [detection, setDetection] = useState(detectInAppBrowser);
  const previewMode = isWebGetAppDialogPreviewMode(search);

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  useEffect(() => {
    if (!open) return;
    setDetection(detectInAppBrowser());
  }, [open]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!shouldOfferWebGetAppPrompt(pathname, search)) {
      setOpen(false);
      return;
    }

    preloadStoreBadgeImages(true);

    const delay = previewMode ? 100 : 500;
    const timer = window.setTimeout(() => {
      if (shouldOfferWebGetAppPrompt(pathname, search)) {
        setOpen(true);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, search, previewMode]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && !isWebGetAppDialogPreviewMode()) {
      markWebGetAppPromptShown();
    }
  };

  if (Capacitor.isNativePlatform()) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "z-[200] max-w-sm border-white/12 bg-[#0a0812] text-white sm:max-w-md",
          isMobile && "max-w-[calc(100vw-2rem)]",
        )}
      >
        <DialogHeader>
          <DialogTitle>Get Palette Plotting on your phone</DialogTitle>
          <DialogDescription className="text-white/60">
            Your membership is best experienced in the app. Manage billing (upgrades/cancellation)
            on web.
          </DialogDescription>
        </DialogHeader>

        {isMobile ? (
          <div
            className="flex w-full flex-col items-center gap-3 py-1"
            style={{ minHeight: STORE_BADGE_ROW_HEIGHT_PX }}
          >
            <MarketingStoreBadges
              layout="inline"
              size="lg"
              getStoreHref={getStoreHref}
            />
          </div>
        ) : (
          <DesktopQrPair />
        )}
      </DialogContent>
    </Dialog>
  );
}
