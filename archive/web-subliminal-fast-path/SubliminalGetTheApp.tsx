import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import { preloadStoreBadgeImagesOnce } from "@/lib/appStore";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";

export const SUBLIMINAL_GET_THE_APP_PATH = "/onboarding/subliminal/get-the-app";

const STEPS = [
  "Download Palette Plotting from the App Store.",
  "Open the app and sign in with the same email you just used. Click \"Already have an account? Sign in.\"",
  "Sign up for a weekly subscription to get a free trial—your subliminal will appear in your track library automatically, a few minutes after login. It'll be faster when you use the app—we promise!",
] as const;

export default function SubliminalGetTheApp() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const inAppBrowser = useMemo(() => detectInAppBrowser(), []);
  const signInEmail = user?.email?.trim() ?? "";

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    preloadStoreBadgeImagesOnce();
    trackMarketingConversion("web_onboarding_signup_complete", {
      source: "subliminal_get_the_app",
      target_path: SUBLIMINAL_GET_THE_APP_PATH,
    });
  }, [navigate]);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.id) {
      navigate("/login", { replace: true, state: { from: SUBLIMINAL_GET_THE_APP_PATH } });
    }
  }, [isLoading, navigate, user?.id]);

  if (isLoading || !user?.id) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <OnboardingLayout
      currentPage={4}
      nativeFormPage
      setupCosmicPage
      hideProgress
      onContinue={() => {}}
      continueText=""
      canContinue={false}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-8 text-white">
        <SetupHeadingBlock
          centered
          title="Your account and free trial are ready"
          subtitle="Click your store to get the app and unlock your tools."
          titleClassName="sv-subliminal-headline !text-white"
          subtitleClassName="!text-white/55 [&_p+p]:mt-1"
        />

        <div className="flex justify-center">
          <MarketingStoreBadges
            size="lg"
            layout="inline"
            stores={["apple"]}
            getStoreHref={(store) => getMobileStoreHref(store, inAppBrowser)}
            onStoreClick={(store) => {
              trackMarketingConversion("cta_app_store_click", {
                source: "subliminal_get_the_app",
                store,
              });
            }}
          />
        </div>

        <ol className="space-y-4 text-left">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "border border-white/20 bg-white/10 text-xs font-semibold text-white",
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              <p className={cn("pt-0.5 text-sm leading-relaxed", SETUP_MUTED_TEXT_CLASS, "!text-white/75")}>
                {index === 1 && signInEmail ? (
                  <>
                    Open the app and sign in with{" "}
                    <span className="font-medium text-white/95">{signInEmail}</span>. Click &ldquo;Already have an
                    account? Sign in.&rdquo;
                  </>
                ) : (
                  step
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </OnboardingLayout>
  );
}
