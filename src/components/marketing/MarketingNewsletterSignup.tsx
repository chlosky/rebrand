import { useState } from "react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { insertEmailCapture } from "@/lib/emailCaptureInsert";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_SOFT_SURFACE_CLASS,
} from "@/components/marketing/marketingVisualTheme";

export function MarketingNewsletterSignup() {
  const { t } = useMarketingTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("home.newsletter.errorEmpty"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("home.newsletter.errorInvalid"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await insertEmailCapture({
        email,
        marketing_consent: true,
        source: "homepage_newsletter",
      });

      if (insertError) throw insertError;

      trackMarketingConversion("newsletter_subscribe", { source: "homepage_newsletter" });
      setIsSuccess(true);
      setEmail("");
    } catch (err: unknown) {
      console.error("[MarketingNewsletterSignup]", err);
      setError(err instanceof Error ? err.message : t("home.newsletter.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="newsletter"
      className={cn(marketingHeroSectionClass, "relative overflow-hidden pb-10 sm:pb-12 lg:pb-14")}
      aria-labelledby="newsletter-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 bottom-0 h-64 w-full max-w-2xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(136,98,158,0.18),transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl">
          {isSuccess ? (
            <div className={cn(MARKETING_SOFT_SURFACE_CLASS, "flex flex-col items-center gap-4 text-center")}>
              <CheckCircle2 className="h-10 w-10 text-[#c9a8bc]" aria-hidden />
              <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-xl sm:text-2xl")}>{t("home.newsletter.successHeading")}</h2>
              <p className={cn(MARKETING_BODY_CLASS, "text-white")}>
                {t("home.newsletter.successBody")}
              </p>
            </div>
          ) : (
            <div className={cn(MARKETING_SOFT_SURFACE_CLASS, "sm:py-10")}>
              <div className="text-center">
                <h2
                  id="newsletter-heading"
                  className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl")}
                >
                  {t("home.newsletter.heading")}
                </h2>
                <p className={cn(MARKETING_BODY_CLASS, "mt-3 text-white")}>
                  {t("home.newsletter.subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder={t("home.newsletter.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 flex-1 border-white/10 bg-white/[0.05] text-white placeholder:text-white/35 focus-visible:ring-[#c9a8bc]/40"
                  autoComplete="email"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className={cn(MARKETING_PRIMARY_CTA_CLASS, "h-12 shrink-0 px-6")}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      {t("home.newsletter.subscribing")}
                    </>
                  ) : (
                    t("home.newsletter.subscribe")
                  )}
                </Button>
              </form>

              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
                {t("home.newsletter.consent")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
