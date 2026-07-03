import { MARKETING_COSMIC_BASE } from "@/components/marketing/marketingVisualTheme";

/** Dense white specks — matches App Store / social starfield art. */
const MARKETING_STARS: readonly { x: number; y: number; r: number; o: number }[] = Array.from(
  { length: 168 },
  (_, i) => ({
    x: ((i * 37 + 11) % 99) + 0.5,
    y: ((i * 23 + 7) % 99) + 0.5,
    r: i % 7 === 0 ? 0.24 : i % 4 === 0 ? 0.16 : i % 3 === 0 ? 0.11 : 0.07,
    o: i % 9 === 0 ? 0.95 : i % 5 === 0 ? 0.72 : i % 3 === 0 ? 0.48 : 0.32,
  }),
);

type MarketingCosmicBackgroundProps = {
  className?: string;
};

/** Marketing starfield — true black + white specks only (no pink in header/hero). */
export function MarketingCosmicBackground({ className }: MarketingCosmicBackgroundProps) {
  return (
    <div className={className} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: MARKETING_COSMIC_BASE }} />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {MARKETING_STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" opacity={star.o} />
        ))}
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_40%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

/** Fixed bottom pink nebula — sticky bar area only, not hero/header. */
export function MarketingBottomPinkGlow({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 90% 100% at 50% 100%, rgba(232, 140, 180, 0.38) 0%, rgba(200, 100, 150, 0.14) 42%, transparent 72%)",
      }}
    />
  );
}
