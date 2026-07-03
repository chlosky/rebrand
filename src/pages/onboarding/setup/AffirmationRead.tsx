import { useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { OnboardingTypewriter } from "@/components/onboarding/OnboardingTypewriter";
import { readSetupDraft } from "@/lib/setupDraft";
import { cn } from "@/lib/utils";
import {
  buildOnboardingAffirmationReadText,
  msPerCharReadingPace,
  resolveOnboardingManifestCategories,
} from "@/lib/onboardingReadAffirmations";
import { SETUP_GLASS_PANEL_CLASS, SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

export default function SetupAffirmationRead() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    if (!isSuiteFunnel) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [isSuiteFunnel, navigate, setupBase]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => resolveOnboardingManifestCategories(readSetupDraft()), []);
  const fullText = useMemo(() => buildOnboardingAffirmationReadText(categories), [categories]);
  const baseTypingMs = useMemo(() => msPerCharReadingPace(fullText), [fullText]);
  /** Slightly slower reveal for the first ~1–2 lines so readers can land before scroll picks up. */
  const speedMsForProgress = useCallback(
    (revealedSoFar: number) =>
      revealedSoFar < 160 ? Math.round(baseTypingMs * 1.38) : baseTypingMs,
    [baseTypingMs],
  );

  /** Eased follow of growing content: stays mostly still early so the first lines are easy to read, then catches up. */
  const easeFollowScroll = useCallback((revealedCount: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    if (maxScroll <= 0) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollTop = maxScroll;
      return;
    }

    let alpha: number;
    if (revealedCount < 220) alpha = 0.06;
    else if (revealedCount < 480) alpha = 0.2;
    else alpha = 0.44;

    const target = maxScroll;
    const dist = target - el.scrollTop;
    if (Math.abs(dist) < 0.55) {
      el.scrollTop = target;
      return;
    }
    el.scrollTop += dist * alpha;
  }, []);

  const canContinue = fullText.length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/current-friction`)}
      onContinue={() => navigate(`${setupBase}/begin-journey`)}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title={t("setup.affirmationRead.title")}
          subtitle={t("setup.affirmationRead.subtitle")}
        />

        {canContinue ? (
          <div
            className={cn(
              SETUP_GLASS_PANEL_CLASS,
              "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden",
            )}
          >
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2 py-4 [-webkit-overflow-scrolling:touch]"
            >
              <OnboardingTypewriter
                text={fullText}
                speedMs={speedMsForProgress}
                onAfterRevealStep={easeFollowScroll}
                reserveMinHeight={false}
                contentClassName="whitespace-pre-wrap px-3 sm:px-5 py-5 sm:py-6 pb-28 pt-3 font-sans text-base sm:text-lg leading-[1.7] text-zinc-800 max-w-none"
              />
            </div>
          </div>
        ) : (
          <p className={SETUP_MUTED_TEXT_CLASS}>
            Choose what you want to manifest first, then come back to this step.
          </p>
        )}
      </div>
    </SetupPage>
  );
}
