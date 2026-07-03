import { cn } from "@/lib/utils";

const MOBILE_DASHBOARD_SRC = "/marketing/hero-mobile-dashboard.png";

type MarketingLaptopMockupProps = {
  className?: string;
  alt?: string;
};

/** Mobile dashboard for #how-it-works — compact on desktop so it doesn’t stretch the section. */
export function MarketingLaptopMockup({
  className,
  alt = "Palette Plotting mobile dashboard — everything you need to manifest, in one place",
}: MarketingLaptopMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[min(100%,240px)] shrink-0 bg-transparent sm:w-[220px] lg:w-[200px]",
        className,
      )}
    >
      <img
        src={MOBILE_DASHBOARD_SRC}
        alt={alt}
        className="block h-auto max-h-[min(42vh,280px)] w-full object-contain object-top bg-transparent shadow-none sm:max-h-[min(48vh,320px)] lg:max-h-[320px]"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
