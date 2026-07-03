# Locale handoff index (2026-06-08)

Use these files with ChatGPT for micromanaged translation QA.

## 1. Complete copy (EN + es-419 + pt-BR)

**File:** [`COMPLETE-COPY-HANDOFF-2026-06-08.md`](./COMPLETE-COPY-HANDOFF-2026-06-08.md) (~369k chars)

Contains literally:

| Section | Contents |
|---------|----------|
| **1** | All **1,994** i18n keys (flattened nested arrays/objects — no `[object Object]`) across 9 namespaces + fragments — table with EN / es-419 / pt-BR side by side |
| **2** | **Onboarding read-aloud affirmations** — 12 categories × 10 lines (Connections, Finances, Confidence, Self-Love, Career, Business, Learning, Discipline, Productivity, Fitness, Nutrition, Organization) |
| **3** | **Premade affirmation sets** — 8 sets in `tools.affirmations.premade.*` (wealth, love, confidence, health, career, spiritual, productivity, learning) with all lines in three languages |
| **4** | **Subliminal maker** — every `tools.subliminal.*` key including tour steps |
| **5** | **Still hardcoded in TS** — routine item labels, category fallbacks, SMS code, legal pages, guide names |
| **6** | Namespace key counts |

Regenerate after locale edits: `node scripts/generate-locale-handoff.mjs`

## 2. Website copy (all translated web languages + legal)

**File:** [`WEBSITE-COPY-HANDOFF-2026-06-09.md`](./WEBSITE-COPY-HANDOFF-2026-06-09.md) (~265k chars)

Website-only translated copy — **English reference column** plus de, zh-Hans, nl, fr, it, pt-BR, es-419:

| Section | Contents |
|---------|----------|
| **1** | Homepage — all `marketing.home.*` keys (122) |
| **2** | What is Palette Plotting — `marketing.whatIsPalettePlotting.*` + `marketing.pricing.features.*` |
| **3** | Manifestation quiz — all `marketing.manifestationQuiz.*` keys |
| **4** | Terms of Use + EULA — full plain text per locale (EN, ES, PT, DE, FR, IT, NL, ZH) |
| **5** | Privacy Policy — full plain text per locale (EN, ES, PT, DE, FR, IT, NL, ZH) |
| **6** | Key counts + ChatGPT QA checklist |

Regenerate: `node scripts/generate-website-copy-handoff.mjs`

## 3. Website English copy only (send to ChatGPT for translation)

**File:** [`WEBSITE-ENGLISH-COPY-2026-06-09.md`](./WEBSITE-ENGLISH-COPY-2026-06-09.md) (~68k chars)

**English source of truth only** — no other languages. Upload to ChatGPT, get translations back, send results here.

| Section | Contents |
|---------|----------|
| **1** | Homepage — `marketing.home.*` |
| **2** | Pricing — `marketing.pricing.*` |
| **3** | Contact — `marketing.contact.*` |
| **4** | FAQ — `marketing.faq.*` |
| **5** | What is Palette Plotting |
| **6** | Manifestation quiz |
| **7–11** | Terms+EULA, Privacy, Acceptable Use, Billing & Refunds, DMCA — full plain text |
| **12** | Community (hardcoded) |

Regenerate: `node scripts/generate-website-english-copy-handoff.mjs`

## 4. App copy missed from June 8 complete handoff (en / es-419 / pt-BR)

**File:** [`../handoff-missed-copy-en-es-419-pt-BR.md`](../handoff-missed-copy-en-es-419-pt-BR.md)

Delta since `COMPLETE-COPY-HANDOFF-2026-06-08.md` — upload to ChatGPT if you already sent the big handoff:

| Section | Contents |
|---------|----------|
| **1** | Welcome sign-in footer (`common.signIn`, `alreadyHaveAccountSignIn`) — **new** |
| **2** | Welcome community proof + mockup alt/aria — **new** |
| **3** | Routine notifications in-app copy (settings + onboarding intensity) — **updated** (removed inspired actions) |
| **4** | Routine push notifications (`pushLocale.ts`) — **never in JSON handoff** |
| **5** | Post-paywall loading (`paywall.postPaywall`) — **updated** (commitment, polish, toasts) |
| **6** | Hardcoded English still at runtime |

Focused scenario docs (same copy, different layout): `handoff-conditional-question-copy.md`, `handoff-post-paywall-loading-copy.md`.

## 5. Settings + manifestation routine — full code and copy (en / es-419 / pt-BR)

**File:** [`../handoff-settings-code-and-copy.md`](../handoff-settings-code-and-copy.md) (~110k chars)

Single paste handoff for ChatGPT QA:

| Section | Contents |
|---------|----------|
| **1** | Routes, 4 Settings tabs (Profile / Settings / Billing / Legal), routine subpage overview |
| **2** | Full `settings` namespace — every key in en / es-419 / pt-BR |
| **3** | `common:cancel` / `common:continue` cross-refs |
| **4** | Routine push payload copy (`pushLocale.ts`) |
| **5** | Full source `Settings.tsx` |
| **6** | Full source `ManifestationRoutineSettings.tsx` |

Notes: phone field hidden in UI; SMS marketing toggle hidden; `legalDisclaimer` empty; one hardcoded English debug toast on routine page. **2026-06-09 revision:** premium copy pass + `settings-${localeKey}` fix for stale Settings-tab language.

## 6. AI content moderation (server-only — no doc handoff)

**Removed:** `handoff-ai-content-moderation.md` — deleted 2026-06-09 so keyword lists are not stored in the repo docs tree.

Moderation internals live only in:
- `supabase/functions/_shared/moderationKeywords.ts`
- `supabase/functions/_shared/aiLocale.ts` (`boundaryTemplates`)
- Edge functions: `handle-chat-message`, `refactor-belief`, `generate-affirmations`, `check-content-moderation`

User-facing copy only: `src/i18n/locales/{en,es-419,pt-BR}/tools.json` (`refactor.toasts.*`, `affirmations.toasts.blockedDefault`).

## 7. Code review (Settings, intensity, Guide, OneSignal)

**File:** [`CODE-REVIEW-settings-intensity-onesignal.md`](./CODE-REVIEW-settings-intensity-onesignal.md) (~140k chars)

Full source for:

- `src/pages/Settings.tsx`
- `src/pages/ManifestationRoutineSettings.tsx` (Settings → manifestation routine subpage)
- `src/pages/onboarding/setup/ManifestationIntensity.tsx`
- `src/pages/onboarding/setup/Guide.tsx`
- `src/services/oneSignal.ts`
- `src/contexts/AuthContext.tsx` (auth + OneSignal block)
- `src/components/LanguageSwitcher.tsx`
- `src/lib/onboardingReadAffirmations.ts`
- `src/lib/affirmations-data.ts`

Includes executive summary of what is fixed vs still English-only.

Regenerate: `node scripts/generate-code-review-handoff.mjs`

---

## Known gaps (still English at runtime)

1. **Guide character names** — River, Sage, Rose, Oliver (display only; themes are translated).
2. **Legal page bodies (app)** — in-app Settings still links ES/PT legal routes only; website has full EN + ES/PT/DE/FR/IT/NL/ZH routes (see website handoff).
3. **Language switcher labels** — English | Español | Português (intentional).
4. **affirmations-data.ts** category fallback labels — only used if `tools.supportCategories.*` key missing (keys exist in all locales).
5. **Existing DB rows** — `manifest_routine_items` saved before i18n may still have English labels until user re-saves routine.

## What was fixed recently (for QA focus)

- Handoff generator **flattens nested arrays** (pills, stats, testimonials, pathLoading rows) — no `[object Object]`.
- Onboarding **read-aloud** title + line polish (confianza, elegida/assumida, única/valiosa).
- **Premade affirmations** — removed gender-slash forms in es-419/pt-BR.
- **Routine item labels** + **SMS verification** → `settings.routine.itemLabels.*`, `settings.profile.smsVerificationMessage`.
- **PT-BR** `subliminares` (not subliminais); **mirror work** → trabajo/trabalho com espelho in quiz copy.
- **checkout** → pago/pagamento; **teleprompter** → pantalla/tela de lectura; **prática** → rotina in quiz.
- **Guide theme bubbles** → `tools:double.choose.themes.*`.
- **Manifestation quiz** + **What is Palette Plotting** → `marketing.manifestationQuiz.*`, `marketing.whatIsPalettePlotting.*`.

## OneSignal — is it wired?

Yes, on native:

| Trigger | What runs |
|---------|-----------|
| User logs in | `oneSignalLogin(uuid)` + tag sync if notifications enabled |
| Language switcher | `syncOneSignalUserLanguage(locale)` + DB `preferred_locale` |
| Onboarding intensity continue | `requestOneSignalPushPermission` + `syncManifestationRoutineOneSignalTags` |
| Settings routine page save | Same tag sync |

Tags include `preferred_locale`, `timezone`, `manifestation_intensity`, `routine_alert_1/2/3`, `routine_notification_times`.

**Dashboard requirement:** Push message templates in OneSignal must exist for `es` / `pt` (via `setLanguage` or `preferred_locale` tag). App code sets language/tags; copy lives in OneSignal.

## Older handoff

[`app-copy-en-pt-BR-es-419.md`](./app-copy-en-pt-BR-es-419.md) — superseded by `COMPLETE-COPY-HANDOFF-2026-06-08.md` for full parity checks.
