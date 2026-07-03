type MarketingHeroPhonesProps = {
  backScreenSrc: string;
  frontScreenSrc: string;
  backAlt: string;
  frontAlt: string;
};

function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full rounded-[2.35rem] border-[3px] border-zinc-800/95 bg-zinc-950 p-[3px] shadow-[0_0_40px_rgba(244,114,182,0.22),0_20px_40px_rgba(0,0,0,0.4)]">
      <div
        className="pointer-events-none absolute left-1/2 top-2 z-10 h-[18px] w-[32%] -translate-x-1/2 rounded-full bg-zinc-900"
        aria-hidden
      />
      <div className="overflow-hidden rounded-[1.95rem] bg-black">
        <img src={src} alt={alt} className="aspect-[9/19.5] w-full object-cover object-top" loading="eager" />
      </div>
    </div>
  );
}

/** Two phones upright, side by side — both screens fully visible. */
export function MarketingHeroPhones({
  backScreenSrc,
  frontScreenSrc,
  backAlt,
  frontAlt,
}: MarketingHeroPhonesProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg px-2 sm:max-w-xl lg:max-w-2xl">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[min(100%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-[80px]"
        aria-hidden
      />

      <div className="relative flex items-end justify-center gap-3 sm:gap-5 lg:gap-6">
        <div className="w-[min(46%,200px)] shrink-0 sm:w-[min(44%,220px)]">
          <PhoneFrame src={backScreenSrc} alt={backAlt} />
        </div>
        <div className="w-[min(46%,200px)] shrink-0 sm:w-[min(44%,220px)]">
          <PhoneFrame src={frontScreenSrc} alt={frontAlt} />
        </div>
      </div>
    </div>
  );
}
