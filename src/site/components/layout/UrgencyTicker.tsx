const TICKER_MESSAGE = "12 COLORS & 3 SIZES · SHIPS TO ALL 50 STATES · FREE SHIPPING";

function TickerStrip({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {Array.from({ length: 4 }).map((_, index) => (
        <span
          key={index}
          className="flex shrink-0 items-center whitespace-nowrap px-10 text-[11px] font-semibold uppercase tracking-[0.15em] sm:text-xs"
        >
          {TICKER_MESSAGE}
          <span className="ml-10 text-white" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function UrgencyTicker() {
  return (
    <div
      className="relative overflow-hidden border-b border-neutral-800 bg-neutral-900 text-white"
      role="region"
      aria-label="Site announcements"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none py-1">
        <TickerStrip />
        <TickerStrip hidden />
      </div>
      <p className="sr-only">{TICKER_MESSAGE}</p>
    </div>
  );
}
