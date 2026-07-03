import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialAppLocale, resolveAppLocale, type AppLocale } from "@/lib/locale";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enOnboardingBase from "./locales/en/onboarding.json";
import enOnboardingReadAffirmations from "./locales/en/onboardingReadAffirmations.json";
import enSettings from "./locales/en/settings.json";
import enAuth from "./locales/en/auth.json";
import enPaywall from "./locales/en/paywall.json";
import enTools from "./locales/en/tools.json";
import enSupport from "./locales/en/support.json";
import enMarketingBase from "./locales/en/marketing.json";
import enMarketingManifestationQuiz from "./locales/en/marketingManifestationQuiz.json";
import enMarketingWhatIs from "./locales/en/marketingWhatIs.json";

import esCommon from "./locales/es-419/common.json";
import esDashboard from "./locales/es-419/dashboard.json";
import esOnboardingBase from "./locales/es-419/onboarding.json";
import esOnboardingReadAffirmations from "./locales/es-419/onboardingReadAffirmations.json";
import esSettings from "./locales/es-419/settings.json";
import esAuth from "./locales/es-419/auth.json";
import esPaywall from "./locales/es-419/paywall.json";
import esTools from "./locales/es-419/tools.json";
import esSupport from "./locales/es-419/support.json";
import esMarketingBase from "./locales/es-419/marketing.json";
import esMarketingManifestationQuiz from "./locales/es-419/marketingManifestationQuiz.json";
import esMarketingWhatIs from "./locales/es-419/marketingWhatIs.json";

import ptCommon from "./locales/pt-BR/common.json";
import ptDashboard from "./locales/pt-BR/dashboard.json";
import ptOnboardingBase from "./locales/pt-BR/onboarding.json";
import ptOnboardingReadAffirmations from "./locales/pt-BR/onboardingReadAffirmations.json";
import ptSettings from "./locales/pt-BR/settings.json";
import ptAuth from "./locales/pt-BR/auth.json";
import ptPaywall from "./locales/pt-BR/paywall.json";
import ptTools from "./locales/pt-BR/tools.json";
import ptSupport from "./locales/pt-BR/support.json";
import ptMarketingBase from "./locales/pt-BR/marketing.json";
import ptMarketingManifestationQuiz from "./locales/pt-BR/marketingManifestationQuiz.json";
import ptMarketingWhatIs from "./locales/pt-BR/marketingWhatIs.json";

import frMarketingBase from "./locales/fr/marketing.json";
import frMarketingManifestationQuiz from "./locales/fr/marketingManifestationQuiz.json";
import frMarketingWhatIs from "./locales/fr/marketingWhatIs.json";
import deMarketingBase from "./locales/de/marketing.json";
import deMarketingManifestationQuiz from "./locales/de/marketingManifestationQuiz.json";
import deMarketingWhatIs from "./locales/de/marketingWhatIs.json";
import itMarketingBase from "./locales/it/marketing.json";
import itMarketingManifestationQuiz from "./locales/it/marketingManifestationQuiz.json";
import itMarketingWhatIs from "./locales/it/marketingWhatIs.json";
import zhMarketingBase from "./locales/zh-Hans/marketing.json";
import zhMarketingManifestationQuiz from "./locales/zh-Hans/marketingManifestationQuiz.json";
import zhMarketingWhatIs from "./locales/zh-Hans/marketingWhatIs.json";
import nlMarketingBase from "./locales/nl/marketing.json";
import nlMarketingManifestationQuiz from "./locales/nl/marketingManifestationQuiz.json";
import nlMarketingWhatIs from "./locales/nl/marketingWhatIs.json";
import arMarketingBase from "./locales/ar/marketing.json";
import arMarketingManifestationQuiz from "./locales/ar/marketingManifestationQuiz.json";
import arMarketingWhatIs from "./locales/ar/marketingWhatIs.json";

const enOnboarding = {
  ...enOnboardingBase,
  setup: {
    ...enOnboardingBase.setup,
    readAffirmations: enOnboardingReadAffirmations,
  },
};
const esOnboarding = {
  ...esOnboardingBase,
  setup: {
    ...esOnboardingBase.setup,
    readAffirmations: esOnboardingReadAffirmations,
  },
};
const ptOnboarding = {
  ...ptOnboardingBase,
  setup: {
    ...ptOnboardingBase.setup,
    readAffirmations: ptOnboardingReadAffirmations,
  },
};

const enMarketing = {
  ...enMarketingBase,
  manifestationQuiz: enMarketingManifestationQuiz,
  whatIsPalettePlotting: enMarketingWhatIs,
};
const esMarketing = {
  ...esMarketingBase,
  manifestationQuiz: esMarketingManifestationQuiz,
  whatIsPalettePlotting: esMarketingWhatIs,
};
const ptMarketing = {
  ...ptMarketingBase,
  manifestationQuiz: ptMarketingManifestationQuiz,
  whatIsPalettePlotting: ptMarketingWhatIs,
};
const frMarketing = {
  ...frMarketingBase,
  manifestationQuiz: frMarketingManifestationQuiz,
  whatIsPalettePlotting: frMarketingWhatIs,
};
const deMarketing = {
  ...deMarketingBase,
  manifestationQuiz: deMarketingManifestationQuiz,
  whatIsPalettePlotting: deMarketingWhatIs,
};
const itMarketing = {
  ...itMarketingBase,
  manifestationQuiz: itMarketingManifestationQuiz,
  whatIsPalettePlotting: itMarketingWhatIs,
};
const zhMarketing = {
  ...zhMarketingBase,
  manifestationQuiz: zhMarketingManifestationQuiz,
  whatIsPalettePlotting: zhMarketingWhatIs,
};
const nlMarketing = {
  ...nlMarketingBase,
  manifestationQuiz: nlMarketingManifestationQuiz,
  whatIsPalettePlotting: nlMarketingWhatIs,
};
const arMarketing = {
  ...arMarketingBase,
  manifestationQuiz: arMarketingManifestationQuiz,
  whatIsPalettePlotting: arMarketingWhatIs,
};

const resources = {
  en: { common: enCommon, dashboard: enDashboard, onboarding: enOnboarding, settings: enSettings, auth: enAuth, paywall: enPaywall, tools: enTools, support: enSupport, marketing: enMarketing },
  "es-419": { common: esCommon, dashboard: esDashboard, onboarding: esOnboarding, settings: esSettings, auth: esAuth, paywall: esPaywall, tools: esTools, support: esSupport, marketing: esMarketing },
  "pt-BR": { common: ptCommon, dashboard: ptDashboard, onboarding: ptOnboarding, settings: ptSettings, auth: ptAuth, paywall: ptPaywall, tools: ptTools, support: ptSupport, marketing: ptMarketing },
  fr: { marketing: frMarketing },
  de: { marketing: deMarketing },
  it: { marketing: itMarketing },
  "zh-Hans": { marketing: zhMarketing },
  nl: { marketing: nlMarketing },
  ar: { marketing: arMarketing },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialAppLocale(),
  supportedLngs: ["en", "es-419", "pt-BR", "fr", "de", "it", "zh-Hans", "nl", "ar"],
  nonExplicitSupportedLngs: false,
  fallbackLng: {
    "es-MX": ["es-419", "en"],
    "es-ES": ["es-419", "en"],
    es: ["es-419", "en"],
    pt: ["pt-BR", "en"],
    fr: ["en"],
    de: ["en"],
    it: ["en"],
    "zh-Hans": ["en"],
    nl: ["en"],
    ar: ["en"],
    default: ["en"],
  },
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
