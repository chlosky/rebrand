import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { Star } from "lucide-react";
import {
  SETUP_GLASS_PANEL_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
  SETUP_TESTIMONIAL_STAR_CLASS,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

type Testimonial = { quote: string; author: string };

function TestimonialMarqueeRow({
  cards,
  animationClass,
}: {
  cards: readonly Testimonial[];
  animationClass: string;
}) {
  return (
    <div
      className="relative z-[1] -mx-1 w-[calc(100%+0.5rem)] overflow-hidden py-1 sm:mx-0 sm:w-full"
      style={{
        maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "flex w-max flex-nowrap gap-2.5 motion-reduce:!animate-none pointer-events-none",
          animationClass,
        )}
        aria-hidden
      >
        {[0, 1].map((dup) =>
          cards.map((card, i) => (
            <figure
              key={`${dup}-${i}-${card.author}`}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "w-[min(260px,72vw)] shrink-0 px-3 py-3",
              )}
            >
              <div className="mb-1.5 flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={SETUP_TESTIMONIAL_STAR_CLASS} />
                ))}
              </div>
              <blockquote className="font-sans text-sm font-medium leading-snug text-zinc-800">“{card.quote}”</blockquote>
              <figcaption className="mt-2 font-sans text-xs text-zinc-500">{card.author}</figcaption>
            </figure>
          )),
        )}
      </div>
    </div>
  );
}

export default function SetupPlotLoading() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const [pct, setPct] = useState(0);
  const testimonialsRow1 = useMemo(
    () => t("setup.plotLoading.testimonials.row1", { returnObjects: true }) as Testimonial[],
    [t],
  );
  const testimonialsRow2 = useMemo(
    () => t("setup.plotLoading.testimonials.row2", { returnObjects: true }) as Testimonial[],
    [t],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => Math.min(100, p + Math.floor(Math.random() * 7 + 3)));
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const tid = window.setTimeout(() => navigate(`${setupBase}/plot-synthesis`), 450);
      return () => window.clearTimeout(tid);
    }
  }, [pct, navigate, setupBase]);

  return (
    <SetupPage
      canContinue={false}
      continueText={t("setup.plotLoading.loading")}
      disableNativeScrollViewport
      onContinue={undefined}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title={t("setup.plotLoading.title")}
          subtitle={t("setup.plotLoading.subtitle")}
        />

        {/* Upper: progress. Remaining height: testimonials vertically centered as a pair. */}
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div
                className={SETUP_PROGRESS_FILL_CLASS}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-zinc-500">
              {t("setup.plotLoading.hint")}
            </p>
            <TestimonialMarqueeRow
              cards={testimonialsRow1}
              animationClass="animate-palette-plotting-testimonials-marquee"
            />
            <TestimonialMarqueeRow
              cards={testimonialsRow2}
              animationClass="animate-palette-plotting-testimonials-marquee-slow"
            />
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
