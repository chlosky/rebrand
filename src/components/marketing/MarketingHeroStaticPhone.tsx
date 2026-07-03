import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    src: "/marketing/hero-app-showcase.png",
    alt: "Palette Plotting — subliminal maker, affirm and script, and mirror work",
  },
  {
    src: "/marketing/hero-app-showcase-slide-2.png",
    alt: "Palette Plotting — belief work, manifestation milestones, and manifesting guide",
  },
] as const;

const HERO_AUTO_MS = 5000;
/** Mobile hero — transform scale (not clipped) with layout slot sized to match. */
const MOBILE_HERO_SCALE = 1.38;

type MarketingHeroStaticPhoneProps = {
  className?: string;
  size?: "default" | "lg";
};

function heroBannerImgClass(isLarge: boolean) {
  return cn(
    "relative mx-auto block h-auto w-full bg-transparent shadow-none object-contain transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
    isLarge
      ? "origin-center scale-[1.1] object-center max-h-[min(48vh,400px)] lg:max-h-[min(52vh,440px)] lg:scale-[1.12]"
      : "origin-top scale-[1.38] object-contain object-top",
  );
}

/** Hero banner — auto crossfade between showcase slides (no arrows/dots). */
export function MarketingHeroStaticPhone({
  className,
  size = "default",
}: MarketingHeroStaticPhoneProps) {
  const isLarge = size === "lg";
  const [slideIndex, setSlideIndex] = useState(0);
  const [slotHeight, setSlotHeight] = useState(0);
  const activeImgRef = useRef<HTMLImageElement>(null);
  const imgClass = heroBannerImgClass(isLarge);

  const remeasure = useCallback(() => {
    const img = activeImgRef.current;
    if (!img || isLarge) return;
    setSlotHeight(Math.ceil(img.offsetHeight * MOBILE_HERO_SCALE));
  }, [isLarge]);

  useEffect(() => {
    for (const slide of HERO_SLIDES) {
      const img = new Image();
      img.src = slide.src;
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, HERO_AUTO_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (isLarge) return;
    remeasure();
    const img = activeImgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(remeasure);
    ro.observe(img);
    window.addEventListener("resize", remeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [isLarge, slideIndex, remeasure]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[min(100%,26rem)] select-none overflow-visible bg-transparent sm:max-w-[min(100%,30rem)]",
        isLarge && "max-w-full",
        className,
      )}
      style={!isLarge && slotHeight > 0 ? { minHeight: slotHeight } : undefined}
      aria-roledescription="carousel"
      aria-label="Palette Plotting app showcase"
    >
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === slideIndex;
        return (
          <img
            key={slide.src}
            ref={isActive ? activeImgRef : undefined}
            src={slide.src}
            alt={isActive ? slide.alt : ""}
            className={cn(
              imgClass,
              isActive
                ? "relative z-[1] opacity-100"
                : "pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0",
            )}
            aria-hidden={!isActive}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : undefined}
            decoding="async"
            draggable={false}
            onLoad={isActive ? remeasure : undefined}
          />
        );
      })}
    </div>
  );
}
