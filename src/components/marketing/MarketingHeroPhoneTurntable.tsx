import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const TURNTABLE_SCREENS = [
  { src: "/marketing/hero-subliminal-maker.png", alt: "Subliminal Maker in Palette Plotting" },
  { src: "/marketing/hero-affirm-script.png", alt: "Affirm and Script in Palette Plotting" },
  { src: "/marketing/hero-choose-guide.png", alt: "Choose a guide in Palette Plotting" },
  { src: "/marketing/hero-rivers-dashboard.png", alt: "Palette Plotting dashboard on iPhone" },
] as const;

const OSCILLATE_DURATION_S = 14;
/** Degrees the turntable swings left/right (phones stay upright, facing viewer). */
const OSCILLATE_SWING_DEG = 26;

function TurntablePhone({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager?: boolean;
}) {
  return (
    <div className="w-[min(36vw,140px)] shrink-0 sm:w-[158px] lg:w-[178px]">
      <div className="relative rounded-[1.6rem] border-2 border-zinc-800/95 bg-zinc-950 p-[2px] shadow-[0_0_32px_rgba(244,114,182,0.2),0_16px_32px_rgba(0,0,0,0.45)] lg:rounded-[2.35rem] lg:border-[3px] lg:p-[3px] lg:shadow-[0_0_40px_rgba(244,114,182,0.22),0_20px_40px_rgba(0,0,0,0.45)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-3 w-[28%] -translate-x-1/2 rounded-full bg-zinc-900 lg:top-2 lg:h-[18px] lg:w-[32%]"
          aria-hidden
        />
        <div className="overflow-hidden rounded-[1.3rem] bg-black lg:rounded-[1.95rem]">
          <img
            src={src}
            alt={alt}
            className="aspect-[9/19.5] w-full object-cover object-top"
            loading={eager ? "eager" : "lazy"}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

type MarketingHeroPhoneTurntableProps = {
  className?: string;
};

/**
 * Upright phones on a horizontal turntable — oscillates in place on a fixed pivot
 * (pin handles centering; ring only rotates so the stack does not drift sideways).
 */
export function MarketingHeroPhoneTurntable({ className }: MarketingHeroPhoneTurntableProps) {
  const count = TURNTABLE_SCREENS.length;
  const step = 360 / count;

  return (
    <div
      className={cn("relative mx-auto w-full select-none", className)}
      style={
        {
          "--turntable-radius": "clamp(100px, 19vw, 160px)",
          "--turntable-duration": `${OSCILLATE_DURATION_S}s`,
          "--turntable-swing-deg": `${OSCILLATE_SWING_DEG}deg`,
        } as CSSProperties
      }
    >
      <style>{`
        @keyframes marketing-hero-turntable-oscillate {
          0%,
          100% {
            transform: rotateY(calc(-1 * var(--turntable-swing-deg)));
          }
          50% {
            transform: rotateY(var(--turntable-swing-deg));
          }
        }
        @keyframes marketing-hero-turntable-face-counter {
          0%,
          100% {
            transform: rotateY(var(--turntable-swing-deg));
          }
          50% {
            transform: rotateY(calc(-1 * var(--turntable-swing-deg)));
          }
        }
        .marketing-hero-turntable-ring {
          transform-origin: center center;
          animation: marketing-hero-turntable-oscillate var(--turntable-duration) ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .marketing-hero-turntable-ring:hover {
          animation-play-state: paused;
        }
        .marketing-hero-turntable-ring:hover .marketing-hero-turntable-face-counter {
          animation-play-state: paused;
        }
        .marketing-hero-turntable-face-counter {
          transform-origin: center center;
          animation: marketing-hero-turntable-face-counter var(--turntable-duration) ease-in-out infinite;
          transform-style: preserve-3d;
        }
        @media (prefers-reduced-motion: reduce) {
          .marketing-hero-turntable-ring,
          .marketing-hero-turntable-face-counter {
            animation: none;
          }
          .marketing-hero-turntable-slot:not(:first-child) {
            display: none;
          }
        }
      `}</style>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,380px)] w-[min(100%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ backgroundColor: "rgba(224, 160, 198, 0.16)" }}
        aria-hidden
      />

      <div
        className="relative mx-auto min-h-[min(72vw,380px)] w-full overflow-visible sm:min-h-[400px] lg:min-h-[440px]"
        style={{ perspective: "1600px", perspectiveOrigin: "50% 50%" }}
      >
        {/* Fixed pin — centering never animates, so the carousel stays on its axis */}
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="marketing-hero-turntable-ring h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
            {TURNTABLE_SCREENS.map((screen, index) => {
              const angle = step * index;
              return (
                <div
                  key={`${screen.src}-${index}`}
                  className="marketing-hero-turntable-slot absolute left-1/2 top-1/2 h-0 w-0"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(var(--turntable-radius))`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    className="marketing-hero-turntable-face-counter"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div
                      className="absolute left-1/2 top-1/2"
                      style={{
                        transform: `translate(-50%, -50%) rotateY(${-angle}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <TurntablePhone src={screen.src} alt={screen.alt} eager={index === 0} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="sr-only">Animated preview of Palette Plotting app screens on iPhone mockups</p>
    </div>
  );
}
