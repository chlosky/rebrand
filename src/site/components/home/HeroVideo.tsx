import { useEffect, useState } from "react";
import { HERO_COVER_SRC } from "@/site/lib/boardHero";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  { src: HERO_COVER_SRC, alt: "palette plotting aesthetic moodboard in a home office" },
  { src: "/marketing/hero-vision.png", alt: "palette plotting Vision board workspace" },
  { src: "/marketing/hero-action.png", alt: "palette plotting Action plan workflow" },
] as const;

const SLIDE_MS = 4000;

type HeroVideoProps = {
  onActiveChange?: (index: number) => void;
};

export function HeroVideo({ onActiveChange }: HeroVideoProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="hero-video-shell relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
      {HERO_SLIDES.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            index === active ? "opacity-100" : "opacity-0",
          )}
          decoding="async"
        />
      ))}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {HERO_SLIDES.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              index === active ? "bg-white" : "bg-white/45",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
