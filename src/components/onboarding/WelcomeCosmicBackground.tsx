import { cn } from "@/lib/utils";

/** Welcome palette — deep violet night, subtle accent (not loud pink). */
export const WELCOME_ACCENT = "#c9a8bc";
export const WELCOME_COSMIC_BASE = "#0a0812";
export const WELCOME_DEEP_BLACK_BASE = "#020104";
export const WELCOME_DEEP_BLACK_MID = "#050308";
export const WELCOME_DEEP_BLACK_SHELL_BG = `linear-gradient(180deg, ${WELCOME_DEEP_BLACK_BASE} 0%, ${WELCOME_DEEP_BLACK_MID} 48%, ${WELCOME_DEEP_BLACK_BASE} 100%)`;

/** Light onboarding shell — flat white, no gradients or texture. */
export const WELCOME_LIGHT_BASE = "#ffffff";
export const WELCOME_LIGHT_SHELL_BG = "#ffffff";

const WELCOME_STARS: readonly { x: number; y: number; r: number; o: number }[] = Array.from(
  { length: 72 },
  (_, i) => ({
    x: ((i * 41 + 13) % 98) + 1,
    y: ((i * 29 + 7) % 97) + 1.5,
    r: i % 4 === 0 ? 0.2 : i % 3 === 0 ? 0.14 : 0.1,
    o: i % 4 === 0 ? 0.5 : 0.28,
  }),
);

/** Restrained starfield — one nebula, no bokeh blobs. */
export function WelcomeCosmicBackground({
  className,
  tone = "cosmic",
}: {
  className?: string;
  tone?: "cosmic" | "deep-black" | "light";
}) {
  const deepBlack = tone === "deep-black";
  const light = tone === "light";

  if (light) {
    return <div className={cn(className, "bg-white")} aria-hidden />;
  }

  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: deepBlack
            ? WELCOME_DEEP_BLACK_SHELL_BG
            : `linear-gradient(180deg, ${WELCOME_COSMIC_BASE} 0%, #0f0d14 50%, #0a0812 100%)`,
        }}
      />
      <svg
        className={
          deepBlack
            ? "absolute inset-0 h-full w-full opacity-60"
            : "absolute inset-0 h-full w-full opacity-80"
        }
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {WELCOME_STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o} />
        ))}
      </svg>
      <div
        className={
          deepBlack
            ? "absolute inset-0 bg-[radial-gradient(ellipse_78%_46%_at_50%_-8%,rgba(86,44,92,0.20),transparent_72%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(88,62,110,0.35),transparent_70%)]"
        }
      />
      <div
        className={
          deepBlack
            ? "absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_108%,rgba(0,0,0,0.86),transparent_54%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,rgba(0,0,0,0.5),transparent_50%)]"
        }
      />
    </div>
  );
}
