import { cn } from "@/lib/utils";

/** Default until a dedicated marketing screenshot is chosen. */
export const MARKETING_STACKED_HERO_SCREEN =
  "/marketing/hero-affirm-script.png";

type MarketingPhoneMockupProps = {
  screenSrc?: string;
  alt?: string;
  className?: string;
};

export function MarketingPhoneMockup({
  screenSrc = MARKETING_STACKED_HERO_SCREEN,
  alt = "Palette Plotting app screenshot",
  className,
}: MarketingPhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[280px] sm:max-w-[300px]", className)}>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/15 blur-[70px]"
        aria-hidden
      />
      <div className="relative rounded-[2.35rem] border-[3px] border-zinc-800/95 bg-zinc-950 p-[3px] shadow-[0_0_48px_rgba(244,114,182,0.18),0_24px_48px_rgba(0,0,0,0.45)]">
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-10 h-[18px] w-[32%] -translate-x-1/2 rounded-full bg-zinc-900"
          aria-hidden
        />
        <div className="overflow-hidden rounded-[1.95rem] bg-black">
          <img
            src={screenSrc}
            alt={alt}
            className="aspect-[9/19.5] w-full object-cover object-top"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
