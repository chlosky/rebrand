import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
  MARKETING_WEB_ONBOARDING_WELCOME_PATH,
} from "@/lib/marketingConversionCopy";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

export function MarketingFinalCta() {
  const navigate = useNavigate();
  const showWebSignup = !Capacitor.isNativePlatform();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(244,114,182,0.2),transparent_60%)]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Choose the assumption. Repeat it until it sticks.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
          Script your life, affirm through the noise, and keep persisting—on mobile or web. One
          workspace for self-concept, SP goals, subliminals, and Law of Assumption practice.
        </p>
        {showWebSignup ? (
          <Button
            size="lg"
            className="mt-8 h-12 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-7 font-semibold text-white hover:opacity-95"
            onClick={() => {
              trackMarketingConversion("web_onboarding_click", {
                source: "homepage_final_cta",
                button_label: MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
                target_path: MARKETING_WEB_ONBOARDING_WELCOME_PATH,
              });
              navigate(MARKETING_WEB_ONBOARDING_WELCOME_PATH);
            }}
          >
            {MARKETING_CTA_MAKE_FIRST_SUBLIMINAL}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
