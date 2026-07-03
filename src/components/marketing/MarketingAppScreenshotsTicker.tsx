import { useEffect, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKETING_APP_SCREENSHOTS } from "@/components/marketing/marketingAppScreenshots";

const SCREENSHOTS_PER_PAGE = 4;

function chunkScreenshots<T>(items: readonly T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

const SCREENSHOT_PAGES = chunkScreenshots(MARKETING_APP_SCREENSHOTS, SCREENSHOTS_PER_PAGE);

const ARROW_ICON_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 sm:h-10 sm:w-10";

const SIDE_ZONE_CLASS =
  "flex min-h-[120px] flex-1 cursor-pointer select-none items-center border-0 bg-transparent text-white outline-none [-webkit-tap-highlight-color:transparent] hover:bg-transparent active:bg-transparent focus:outline-none focus-visible:outline-none sm:min-h-[160px]";

function blurAfterClick(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

export function MarketingAppScreenshotsTicker() {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = SCREENSHOT_PAGES.length;
  const canNavigate = pageCount > 1;

  useEffect(() => {
    for (const shot of MARKETING_APP_SCREENSHOTS) {
      const img = new Image();
      img.src = shot.src;
    }
  }, []);

  const goPrev = () => {
    if (!canNavigate) return;
    setPageIndex((i) => (i === 0 ? pageCount - 1 : i - 1));
  };

  const goNext = () => {
    if (!canNavigate) return;
    setPageIndex((i) => (i === pageCount - 1 ? 0 : i + 1));
  };

  return (
    <section
      className="relative pb-6 pt-2 sm:pb-8"
      aria-label="Palette Plotting app screenshots"
      aria-roledescription="carousel"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex w-full items-stretch">
          <button
            type="button"
            className={cn(SIDE_ZONE_CLASS, "justify-end pr-2 sm:pr-4")}
            onClick={(event) => {
              goPrev();
              blurAfterClick(event);
            }}
            disabled={!canNavigate}
            aria-label="Previous app screenshots"
          >
            <span className={ARROW_ICON_CLASS} aria-hidden>
              <ChevronLeft className="h-5 w-5" />
            </span>
          </button>

          <div className="relative w-3/4 shrink-0">
            {SCREENSHOT_PAGES.map((pageShots, pageNumber) => {
              const isActive = pageNumber === pageIndex;
              return (
                <ul
                  key={pageNumber}
                  className={cn(
                    "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5",
                    isActive
                      ? "relative z-[1] opacity-100"
                      : "pointer-events-none absolute inset-0 z-0 opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  {pageShots.map((shot) => (
                    <li key={shot.src} className="min-w-0">
                      <img
                        src={shot.src}
                        alt={isActive ? shot.alt : ""}
                        className="pointer-events-none w-full rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                        loading="eager"
                        decoding="async"
                        draggable={false}
                      />
                    </li>
                  ))}
                </ul>
              );
            })}
          </div>

          <button
            type="button"
            className={cn(SIDE_ZONE_CLASS, "justify-start pl-2 sm:pl-4")}
            onClick={(event) => {
              goNext();
              blurAfterClick(event);
            }}
            disabled={!canNavigate}
            aria-label="Next app screenshots"
          >
            <span className={ARROW_ICON_CLASS} aria-hidden>
              <ChevronRight className="h-5 w-5" />
            </span>
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Screenshot pages">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              aria-label={`Screenshot set ${i + 1}`}
              onClick={(event) => {
                setPageIndex(i);
                blurAfterClick(event);
              }}
              className={cn(
                "h-2 w-2 rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
                i === pageIndex ? "bg-white" : "bg-white/30",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
