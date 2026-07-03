import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  SETUP_GLASS_PANEL_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
  SETUP_TESTIMONIAL_STAR_CLASS,
} from "@/lib/onboardingSetupTheme";
import { supabase } from "@/integrations/supabase/client";
import { readSetupDraft } from "@/lib/setupDraft";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { SUBLIMINAL_GET_THE_APP_PATH } from "@/internal/webSubliminalFastPath/SubliminalGetTheApp";

const SUBLIMINAL_EMAIL_PATH = "/onboarding/subliminal/setup/email";

type Testimonial = { readonly quote: string; readonly author: string };

const TESTIMONIALS_ROW_1: readonly Testimonial[] = [
  { quote: "This finally made my new story feel normal.", author: "Jordan M." },
  { quote: "I stopped checking the 3D and stayed consistent—finally.", author: "Riley T." },
  { quote: "The tool path was exactly what I needed.", author: "Casey L." },
  { quote: "The affirmations actually sounded like me, not generic fluff.", author: "Morgan P." },
] as const;

const TESTIMONIALS_ROW_2: readonly Testimonial[] = [
  { quote: "My self-concept shifted fast once I had structure.", author: "Dev S." },
  { quote: "Having one place for mirror work and subliminals kept me honest.", author: "Avery K." },
  { quote: "Small daily wins added up quicker than I expected.", author: "Quinn R." },
  { quote: "I actually finish sessions now instead of doom-scrolling.", author: "Jamie H." },
] as const;

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
              className={cn(SETUP_GLASS_PANEL_CLASS, "w-[min(260px,72vw)] shrink-0 px-3 py-3")}
            >
              <div className="mb-1.5 flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={SETUP_TESTIMONIAL_STAR_CLASS} />
                ))}
              </div>
              <blockquote className="font-sans text-sm font-medium leading-snug text-white/90">
                &ldquo;{card.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-2 font-sans text-xs text-white/50">{card.author}</figcaption>
            </figure>
          )),
        )}
      </div>
    </div>
  );
}

export default function SubliminalPathLoading() {
  const navigate = useNavigate();
  const { updateSession } = useOnboardingSession();
  const [pct, setPct] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const report = (percent: number) => setPct((p) => Math.max(p, Math.min(100, percent)));

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        navigate(SUBLIMINAL_EMAIL_PATH, { replace: true });
        return;
      }

      const uid = user.id;
      const draftSnapshot = readSetupDraft();
      report(35);

      const sessionPatch: Record<string, unknown> = {
        email: draftSnapshot.email ?? user.email ?? null,
        first_name: draftSnapshot.firstName ?? null,
        username: draftSnapshot.email ?? user.email ?? null,
        email_consent: draftSnapshot.emailMarketingConsent === true,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }

      await updateSession(sessionPatch);

      report(100);

      trackMarketingConversion("web_onboarding_signup_complete", {
        source: "subliminal_path_loading",
        target_path: SUBLIMINAL_GET_THE_APP_PATH,
      });

      window.setTimeout(() => {
        navigate(SUBLIMINAL_GET_THE_APP_PATH, { replace: true });
      }, 450);
    })();
  }, [navigate, updateSession]);

  return (
    <SetupPage canContinue={false} continueText="Loading" disableNativeScrollViewport onContinue={undefined}>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title="Finishing your setup…"
          subtitle="Saving your preferences before you continue."
          titleClassName="sv-subliminal-headline"
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div className={SETUP_PROGRESS_FILL_CLASS} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-white/55">
              You&apos;re not starting from zero—your starter track will be ready in the app.
            </p>
            <TestimonialMarqueeRow cards={TESTIMONIALS_ROW_1} animationClass="animate-palette-plotting-testimonials-marquee" />
            <TestimonialMarqueeRow
              cards={TESTIMONIALS_ROW_2}
              animationClass="animate-palette-plotting-testimonials-marquee-slow"
            />
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
