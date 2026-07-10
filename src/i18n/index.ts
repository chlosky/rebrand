import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialAppLocale, resolveAppLocale, type AppLocale } from "@/lib/locale";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enOnboarding from "./locales/en/onboarding.json";
import enSettings from "./locales/en/settings.json";
import enAuth from "./locales/en/auth.json";
import enPaywall from "./locales/en/paywall.json";
import enTools from "./locales/en/tools.json";
import enSupport from "./locales/en/support.json";
import enMarketingBase from "./locales/en/marketing.json";
import enMarketingWhatIs from "./locales/en/marketingWhatIs.json";

const enMarketing = {
  ...enMarketingBase,
  whatIsPalettePlotting: enMarketingWhatIs,
};

const resources = {
  en: { common: enCommon, dashboard: enDashboard, onboarding: enOnboarding, settings: enSettings, auth: enAuth, paywall: enPaywall, tools: enTools, support: enSupport, marketing: enMarketing },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialAppLocale(),
  supportedLngs: ["en"],
  nonExplicitSupportedLngs: false,
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "dashboard", "onboarding", "settings", "auth", "paywall", "tools", "support", "marketing"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: "languageChanged loaded" },
});

export async function setAppLocale(locale: AppLocale): Promise<void> {
  const active = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  if (active === locale) return;
  await i18n.changeLanguage(locale);
}

export default i18n;
