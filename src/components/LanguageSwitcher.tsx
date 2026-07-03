import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_SWITCHER_OPTIONS,
  resolveAppLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { syncRevenueCatUILocale } from "@/services/revenueCat";
import { syncOneSignalUserLanguage } from "@/services/oneSignal";

type LanguageSwitcherProps = {
  className?: string;
  /** Persist to Supabase when user is logged in (e.g. Settings). */
  persistToAccount?: boolean;
  /** Welcome cosmic shell uses light-on-dark labels. */
  variant?: "welcome" | "default";
};

/**
 * Inline locale control — not a dedicated page. Labels stay English | Español | Português.
 */
export function LanguageSwitcher({
  className,
  persistToAccount,
  variant = "welcome",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = resolveAppLocale(i18n.resolvedLanguage || i18n.language);

  const onSelect = async (locale: AppLocale) => {
    if (locale === current) return;

    writeStoredPreferredLocale(locale);
    await setAppLocale(locale);
    if (!persistToAccount) {
      void writeSetupDraft({ locale });
    }

    await Promise.allSettled([
      syncRevenueCatUILocale(),
      syncOneSignalUserLanguage(locale),
    ]);

    if (persistToAccount) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;

      const [prefsRes, profileRes] = await Promise.all([
        supabase.from("user_preferences").upsert(
          { user_id: userId, preferred_locale: locale },
          { onConflict: "user_id" },
        ),
        supabase.from("profiles").upsert(
          { id: userId, preferred_locale: locale },
          { onConflict: "id" },
        ),
      ]);

      if (prefsRes.error || profileRes.error) {
        console.error(
          "[LanguageSwitcher] failed to persist locale:",
          prefsRes.error ?? profileRes.error,
        );
      }
    }
  };

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs", className)}
      role="group"
      aria-label="Language"
    >
      {LANGUAGE_SWITCHER_OPTIONS.map((opt, index) => (
        <span key={opt.code} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span
              className={variant === "welcome" ? "text-white/35" : "text-muted-foreground/50"}
              aria-hidden
            >
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void onSelect(opt.code)}
            aria-pressed={current === opt.code}
            className={cn(
              "relative z-10 min-h-11 min-w-[4.5rem] cursor-pointer touch-manipulation px-2 py-2 font-sans transition-colors",
              variant === "welcome"
                ? current === opt.code
                  ? "font-semibold text-white"
                  : "font-medium text-white/55 hover:text-white/80"
                : current === opt.code
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
