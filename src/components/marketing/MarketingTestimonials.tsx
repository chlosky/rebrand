import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_PINK,
} from "@/components/marketing/marketingVisualTheme";

type TestimonialItem = { quote: string; name: string; role: string };

const MOBILE_QUOTE_BOX_CLASS = cn(
  MARKETING_BODY_CLASS,
  "mt-3 box-border rounded-[1.75rem] bg-black px-5 py-4 text-left text-[14px] leading-snug text-white/90 ring-1 ring-white/15 sm:text-[15px]",
);

const ARROW_BTN_CLASS =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-white/20 bg-[#020102]/90 text-white shadow-[0_0_12px_rgba(0,0,0,0.5)] outline-none [-webkit-tap-highlight-color:transparent] hover:border-white/35 hover:bg-white/10 active:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40";

function blurAfterClick(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

function StarRating({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className="flex justify-center gap-0.5" aria-label={ariaLabel}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="h-3 w-3 fill-white text-white" />
      ))}
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  starsAria,
  className,
  quoteBoxMinHeight,
  mobileCarousel = false,
}: {
  quote: string;
  name: string;
  role: string;
  className?: string;
  quoteBoxMinHeight?: number;
  mobileCarousel?: boolean;
  starsAria: string;
}) {
  return (
    <blockquote className={cn("flex flex-col text-center", className)}>
      <StarRating ariaLabel={starsAria} />
      <p
        style={quoteBoxMinHeight ? { minHeight: quoteBoxMinHeight } : undefined}
        className={cn(
          mobileCarousel
            ? MOBILE_QUOTE_BOX_CLASS
            : cn(
                MARKETING_BODY_CLASS,
                "mt-3 flex-1 rounded-[1.75rem] bg-black px-5 py-4 text-left text-[14px] leading-snug text-white/90 ring-1 ring-white/15 sm:text-[15px] md:text-center md:leading-relaxed",
              ),
        )}
      >
        {quote}
      </p>
      <footer className="mt-2.5 shrink-0">
        <cite className="not-italic text-sm font-medium text-white/80">{name}</cite>
        <p className="mt-0.5 text-xs text-white/45">{role}</p>
      </footer>
    </blockquote>
  );
}

function useMobileCarouselHeights() {
  const slotRef = useRef<HTMLDivElement>(null);
  const quoteMeasureRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const slideMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [quoteBoxMinHeight, setQuoteBoxMinHeight] = useState(0);
  const [slideMinHeight, setSlideMinHeight] = useState(0);

  const measure = useCallback(() => {
    const quoteHeights = quoteMeasureRefs.current.map((el) => el?.offsetHeight ?? 0);
    const maxQuote = Math.max(0, ...quoteHeights);
    if (maxQuote > 0) setQuoteBoxMinHeight(maxQuote);

    const slideHeights = slideMeasureRefs.current.map((el) => el?.offsetHeight ?? 0);
    const maxSlide = Math.max(0, ...slideHeights);
    if (maxSlide > 0) setSlideMinHeight(maxSlide);
  }, []);

  const setQuoteMeasureRef = useCallback(
    (index: number) => (el: HTMLParagraphElement | null) => {
      quoteMeasureRefs.current[index] = el;
      measure();
    },
    [measure],
  );

  const setSlideMeasureRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      slideMeasureRefs.current[index] = el;
      measure();
    },
    [measure],
  );

  useLayoutEffect(() => {
    measure();
    const slot = slotRef.current;
    if (!slot) return;
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [measure]);

  useLayoutEffect(() => {
    if (quoteBoxMinHeight > 0) measure();
  }, [quoteBoxMinHeight, measure]);

  return { slotRef, quoteBoxMinHeight, slideMinHeight, setQuoteMeasureRef, setSlideMeasureRef };
}

/** Mobile carousel: equal-height quote bubbles sized to the longest review. */
function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialItem[] }) {
  const { t } = useMarketingTranslation();
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const canNavigate = count > 1;
  const active = testimonials[index]!;
  const { slotRef, quoteBoxMinHeight, slideMinHeight, setQuoteMeasureRef, setSlideMeasureRef } =
    useMobileCarouselHeights();

  const goPrev = () => {
    if (!canNavigate) return;
    setIndex((i) => (i === 0 ? count - 1 : i - 1));
  };

  const goNext = () => {
    if (!canNavigate) return;
    setIndex((i) => (i === count - 1 ? 0 : i + 1));
  };

  return (
    <div
      className="mt-6 sm:mt-8 md:hidden"
      aria-label={t("home.testimonials.carouselAria")}
      aria-roledescription="carousel"
    >
      <div className="mx-auto flex w-full items-stretch gap-1 sm:gap-2">
        <button
          type="button"
          className={cn(ARROW_BTN_CLASS, "self-center")}
          onClick={(event) => {
            goPrev();
            blurAfterClick(event);
          }}
          disabled={!canNavigate}
          aria-label={t("home.testimonials.previous")}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div ref={slotRef} className="relative min-w-0 flex-1 px-0.5">
          {/* Same width as carousel — measure natural quote box heights */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex flex-col opacity-0"
            aria-hidden
          >
            {testimonials.map((item, i) => (
              <p
                key={`measure-${item.name}`}
                ref={setQuoteMeasureRef(i)}
                className={MOBILE_QUOTE_BOX_CLASS}
              >
                {item.quote}
              </p>
            ))}
          </div>

          <div
            className="grid w-full"
            style={quoteBoxMinHeight > 0 ? { minHeight: quoteBoxMinHeight + 88 } : undefined}
          >
            {testimonials.map((item, i) => (
              <div
                key={item.name}
                className={cn(
                  "col-start-1 row-start-1 min-w-0 transition-opacity duration-200",
                  i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
                )}
                aria-hidden={i !== index}
              >
                <TestimonialCard
                  quote={item.quote}
                  name={item.name}
                  role={item.role}
                  mobileCarousel
                  starsAria={t("home.testimonials.starsAria")}
                  quoteBoxMinHeight={quoteBoxMinHeight > 0 ? quoteBoxMinHeight : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={cn(ARROW_BTN_CLASS, "self-center")}
          onClick={(event) => {
            goNext();
            blurAfterClick(event);
          }}
          disabled={!canNavigate}
          aria-label={t("home.testimonials.next")}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label={t("home.testimonials.pagesAria")}
      >
        {testimonials.map((item, i) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={t("home.testimonials.pageN", { n: i + 1 })}
            onClick={(event) => {
              setIndex(i);
              blurAfterClick(event);
            }}
            className={cn(
              "h-2 w-2 rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
              i === index ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {active.name}, {active.role}
      </p>
    </div>
  );
}

export function MarketingTestimonials() {
  const { t } = useMarketingTranslation();
  const testimonials = t("home.testimonials.items", { returnObjects: true }) as TestimonialItem[];

  return (
    <section
      id="testimonials"
      className={cn(marketingHeroSectionClass, "!py-10 sm:!py-12 lg:!py-14")}
    >
      <div className="relative mx-auto w-full max-w-7xl overflow-x-clip px-4 sm:px-6">
        <h2
          className={cn(
            MARKETING_DISPLAY_CLASS,
            "text-center text-2xl sm:text-3xl lg:text-[2rem]",
          )}
        >
          <span className="block text-white md:inline">{t("home.testimonials.headlineLine1")}</span>{" "}
          <span
            className="block md:inline"
            style={{ color: MARKETING_PINK }}
          >
            {t("home.testimonials.headlineLine2")}
          </span>
        </h2>

        <TestimonialsCarousel testimonials={testimonials} />
        <div className="mt-8 hidden grid-cols-3 gap-5 md:grid">
          {testimonials.map((item) => (
            <TestimonialCard
              key={item.name}
              quote={item.quote}
              name={item.name}
              role={item.role}
              starsAria={t("home.testimonials.starsAria")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
