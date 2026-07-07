import { useEffect, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { inAppBrowserLabel, type InAppBrowserKind } from "@/lib/inAppBrowserDetection";

type MobileStoreFallbackSheetProps = {
  open: boolean;
  store: MobileWebStore;
  storeUrl: string;
  browserKind: InAppBrowserKind | null;
  isIos: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onCopy: () => Promise<boolean>;
};

export function MobileStoreFallbackSheet({
  open,
  storeUrl,
  browserKind,
  isIos,
  onClose,
  onTryAgain,
  onCopy,
}: MobileStoreFallbackSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowUrlFallback(false);
    }
  }, [open]);

  if (!open) return null;

  const browserName = browserKind ? inAppBrowserLabel(browserKind) : "this app";
  const title = "Mobile app link did not open?";
  const bodyCopy = isIos
    ? `${browserName} may have blocked the mobile app link. Tap copy, then open Safari and paste.`
    : `${browserName} may have blocked the mobile app link. Tap copy, then open Chrome and paste.`;

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      return;
    }
    setShowUrlFallback(true);
    requestAnimationFrame(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    });
  };

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby="store-fallback-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10",
          "bg-[#0a0608]/97 px-4 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
          "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 id="store-fallback-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-white/65">{bodyCopy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-full bg-white text-sm font-semibold text-[#120810] hover:bg-white/90"
            onClick={onTryAgain}
          >
            Try opening app link again
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-full border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy app link"}
          </Button>

          {showUrlFallback ? (
            <input
              ref={urlInputRef}
              readOnly
              value={storeUrl}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80"
              aria-label="Mobile app link"
            />
          ) : null}

          <p className="text-center text-[11px] leading-snug text-white/45">
            If {browserName} keeps blocking it, open {isIos ? "Safari" : "Chrome"} and paste the copied link.
          </p>
        </div>
      </div>
    </div>
  );
}
