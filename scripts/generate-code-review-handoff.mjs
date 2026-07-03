import fs from "fs";
import path from "path";

const files = [
  { title: "Settings.tsx (full)", path: "src/pages/Settings.tsx" },
  { title: "ManifestationRoutineSettings.tsx (settings subpage — manifestation routine)", path: "src/pages/ManifestationRoutineSettings.tsx" },
  { title: "ManifestationIntensity.tsx (onboarding setup step)", path: "src/pages/onboarding/setup/ManifestationIntensity.tsx" },
  { title: "Guide.tsx (onboarding guide picker)", path: "src/pages/onboarding/setup/Guide.tsx" },
  { title: "oneSignal.ts (push + locale tags)", path: "src/services/oneSignal.ts" },
  { title: "AuthContext.tsx (OneSignal login + tag sync on auth)", path: "src/contexts/AuthContext.tsx", start: 1, end: 320 },
  { title: "LanguageSwitcher.tsx (locale persist + OneSignal language)", path: "src/components/LanguageSwitcher.tsx" },
  { title: "onboardingReadAffirmations.ts (read-aloud builder)", path: "src/lib/onboardingReadAffirmations.ts" },
  { title: "affirmations-data.ts (premade sets + categories)", path: "src/lib/affirmations-data.ts" },
];

let out = "";
out += "# Code review handoff — Settings, Manifestation Intensity, Guide, OneSignal\n\n";
out += "Generated: 2026-06-08\n\n";
out += "## Executive summary\n\n";
out += "### Guide.tsx — FIXED for theme bubbles\n";
out += "- Theme bubbles use `tTools(THEME_I18N_KEYS[theme])` from `tools:double.choose.themes.*`.\n";
out += "- Character names (River, Sage, Rose, Oliver) remain English hardcoded.\n";
out += "- Title/subtitle use `onboarding:setup.guide.*`.\n\n";

out += "### ManifestationIntensity.tsx (onboarding)\n";
out += "- UI strings use `onboarding:setup.manifestationIntensity.*` (translated).\n";
out += "- **BUG/GAP:** `manifest_routine_items` labels pushed to draft/DB are English: Affirmations, Subliminal listening, Mirror work, etc.\n";
out += "- OneSignal: calls `requestOneSignalPushPermission` + `syncManifestationRoutineOneSignalTags` on continue (native only).\n\n";

out += "### ManifestationRoutineSettings.tsx (Settings → manifestation routine)\n";
out += "- UI uses `settings:routine.*` and `settings:routine.intensity.*` (translated).\n";
out += "- **GAP:** `defaultRoutineItems` and stored `label` fields still English.\n";
out += "- OneSignal: syncs tags on save when notifications toggled; uses `preferredLocale` from `detectInitialAppLocale()` at component level (not i18n.resolvedLanguage).\n\n";

out += "### OneSignal wiring\n";
out += "1. **Login:** `AuthContext` calls `oneSignalLogin(user.id)` on native when user logs in.\n";
out += "2. **Language:** `syncOneSignalUserLanguage` → `OneSignal.User.setLanguage(oneSignalLanguageForApp(locale))`.\n";
out += "3. **Tags:** `syncManifestationRoutineOneSignalTags` sets: manifestation_intensity, notifications_enabled, notification_permission_status, preferred_locale, timezone, routine_alert_1/2/3, routine_notification_times.\n";
out += "4. **LanguageSwitcher:** updates localStorage, setup draft, RevenueCat UI locale, OneSignal language, and DB `preferred_locale` on profiles + user_preferences when `persistToAccount`.\n";
out += "5. **Onboarding intensity step:** syncs tags after draft write; does NOT pass `preferredLocale` explicitly (uses `detectInitialAppLocale()` inside sync function).\n";
out += "6. **Push copy language:** OneSignal dashboard must have es/pt message templates keyed off `preferred_locale` tag or `setLanguage`.\n\n";

out += "### Settings.tsx\n";
out += "- Fully wired to `settings` namespace via `useTranslation('settings')`.\n";
out += "- Links to `/dashboard/settings/manifestation-routine` for routine subpage.\n";
out += "- SMS verification message still hardcoded English.\n\n";

out += "---\n\n";

for (const f of files) {
  const full = path.join(process.cwd(), f.path);
  const content = fs.readFileSync(full, "utf8");
  const lines = content.split("\n");
  const slice =
    f.start != null
      ? lines.slice(f.start - 1, f.end).join("\n")
      : content;
  out += `## ${f.title}\n\n`;
  out += `Path: \`${f.path}\`\n\n`;
  out += "```tsx\n";
  out += slice;
  out += "\n```\n\n---\n\n";
}

const outPath = "docs/locale-handoff/CODE-REVIEW-settings-intensity-onesignal.md";
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} (${out.length} chars)`);
