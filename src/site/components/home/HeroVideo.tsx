import { HERO_COVER_SRC } from "@/site/lib/boardHero";

export function HeroVideo() {
  return (
    <div className="hero-video-shell relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
      <img
        src={HERO_COVER_SRC}
        alt="palette plotting aesthetic moodboard in a home office"
        className="h-full w-full object-cover"
        decoding="async"
      />
    </div>
  );
}
