# Handoff: Missed app copy — full tables (en / es-419 / pt-BR)

Updated 2026-06-09 (community proof, pt-BR routine in-app, help-reply push approved). Paste this entire file to ChatGPT. English is reference.

**Source type legend**

| Source type | Meaning |
|-------------|---------|
| App JSON | `src/i18n/locales/{locale}/*.json` via react-i18next |
| TypeScript hardcoded | String literal in `.tsx` / `.ts` — not in i18n |
| Supabase edge function copy | String in `supabase/functions/**` — deployed separately |
| OneSignal API payload | Copy sent in REST payload from edge function; **not** configured in OneSignal dashboard templates |

---

## 1. Welcome — sign-in footer

| File path | i18n key | English | es-419 | pt-BR | Source type |
|-----------|----------|---------|--------|-------|-------------|
| `src/i18n/locales/en/common.json` | `signIn` | Sign In | — | — | App JSON |
| `src/i18n/locales/es-419/common.json` | `signIn` | — | Iniciar sesión | — | App JSON |
| `src/i18n/locales/pt-BR/common.json` | `signIn` | — | — | Entrar | App JSON |
| `src/i18n/locales/en/common.json` | `alreadyHaveAccountSignIn` | Already have an account? Sign in | — | — | App JSON |
| `src/i18n/locales/es-419/common.json` | `alreadyHaveAccountSignIn` | — | ¿Ya tienes cuenta? Inicia sesión | — | App JSON |
| `src/i18n/locales/pt-BR/common.json` | `alreadyHaveAccountSignIn` | — | — | Já tem uma conta? Entre | App JSON |

**UI:** `src/pages/onboarding/Welcome.tsx` — native footer uses namespace `common`.

---

## 2. Welcome — community proof + mockup alt/aria

| File path | i18n key | English | es-419 | pt-BR | Source type |
|-----------|----------|---------|--------|-------|-------------|
| `src/i18n/locales/en/onboarding.json` → `welcome` | `communityProof` | Loved by manifestors | — | — | App JSON |
| `src/i18n/locales/es-419/onboarding.json` → `welcome` | `communityProof` | — | Amada por quienes manifiestan | — | App JSON |
| `src/i18n/locales/pt-BR/onboarding.json` → `welcome` | `communityProof` | — | — | Amado por quem manifesta | App JSON |
| `src/i18n/locales/en/onboarding.json` → `welcome` | `mockupScreenAlt` | Subliminal Maker — your tracks | — | — | App JSON |
| `src/i18n/locales/es-419/onboarding.json` → `welcome` | `mockupScreenAlt` | — | Creador de subliminales — tus pistas | — | App JSON |
| `src/i18n/locales/pt-BR/onboarding.json` → `welcome` | `mockupScreenAlt` | — | — | Criador de subliminares — suas faixas | App JSON |
| `src/i18n/locales/en/onboarding.json` → `welcome` | `mockupPreviewAria` | Subliminal Maker app preview | — | — | App JSON |
| `src/i18n/locales/es-419/onboarding.json` → `welcome` | `mockupPreviewAria` | — | Vista previa del Creador de subliminales | — | App JSON |
| `src/i18n/locales/pt-BR/onboarding.json` → `welcome` | `mockupPreviewAria` | — | — | Prévia do Criador de subliminares | App JSON |

**UI:** `src/pages/onboarding/Welcome.tsx` — namespace `onboarding`.

---

## 3. Routine notifications — in-app copy

### 3a. Settings → Manifestation routine page

| File path | i18n key | English | es-419 | pt-BR | Source type |
|-----------|----------|---------|--------|-------|-------------|
| `src/i18n/locales/en/settings.json` → `routine` | `notificationsDescription` | Notifications support your routine — they nudge you back to the app. | — | — | App JSON |
| `src/i18n/locales/es-419/settings.json` → `routine` | `notificationsDescription` | — | Las notificaciones apoyan tu rutina: te recuerdan volver a la app. | — | App JSON |
| `src/i18n/locales/pt-BR/settings.json` → `routine` | `notificationsDescription` | — | — | As notificações apoiam sua rotina: elas lembram você de voltar ao app. | App JSON |

**UI:** `src/pages/ManifestationRoutineSettings.tsx` — namespace `settings`, key `routine.notificationsDescription`.

### 3b. Onboarding → Manifestation intensity step

| File path | i18n key | English | es-419 | pt-BR | Source type |
|-----------|----------|---------|--------|-------|-------------|
| `src/i18n/locales/en/onboarding.json` → `setup.manifestationIntensity` | `notificationsHint` | Notifications support your routine — they nudge you back to the app. | — | — | App JSON |
| `src/i18n/locales/es-419/onboarding.json` → `setup.manifestationIntensity` | `notificationsHint` | — | Las notificaciones apoyan tu rutina: te recuerdan volver a la app. | — | App JSON |
| `src/i18n/locales/pt-BR/onboarding.json` → `setup.manifestationIntensity` | `notificationsHint` | — | — | As notificações apoiam sua rotina: elas lembram você de voltar ao app. | App JSON |

**UI:** `src/pages/onboarding/setup/ManifestationIntensity.tsx` — namespace `onboarding`, key `setup.manifestationIntensity.notificationsHint`.

---

## 4. Routine push notifications — `pushLocale.ts`

**File:** `supabase/functions/_shared/pushLocale.ts`  
**Sent by:** `supabase/functions/send-routine-push-notifications/index.ts`  
**Source type:** Supabase edge function copy

### 4a. Routine reminder push — `ROUTINE_PUSH_COPY`

| Field | English | es-419 | pt-BR |
|-------|---------|--------|-------|
| `heading` | Time to manifest! | ¡Hora de manifestar! | Hora de manifestar! |
| `subtitle` | Get back into the app to manifest | Vuelve a la app | Volte para o app |
| `body` | Your dreams are waiting. Let's return to your manifesting practice now. | Tu deseo te espera. Entra y retoma tu rutina. | Seu desejo te espera. Entre e retome sua rotina. |

### 4b. Help reply push body — `HELP_REPLY_PUSH_BODY`

| Field | English | es-419 | pt-BR |
|-------|---------|--------|-------|
| `body` | We replied to your help request. | Ya respondimos tu solicitud. | Já respondemos sua solicitação. |

**Help reply heading** (English only, hardcoded in edge function):

| File path | Location | English | es-419 | pt-BR | Source type |
|-----------|----------|---------|--------|-------|-------------|
| `supabase/functions/send-help-request-reply-push/index.ts` | `const PUSH_HEADING` | Palette Plotting | — | — | Supabase edge function copy |

---

## 5. Post-paywall loading

**Namespace:** `paywall.postPaywall`  
**Files:** `src/i18n/locales/{en,es-419,pt-BR}/paywall.json`  
**UI:** `src/pages/onboarding/PostPaywallLoading.tsx`, `src/pages/onboarding/AndroidPostPaywallLoading.tsx`  
**Source type:** App JSON

### 5a. Main screen strings

| i18n key | English | es-419 | pt-BR |
|----------|---------|--------|-------|
| `title` | Your path is ready | Tu camino está listo | Seu caminho está pronto |
| `buildingDashboard` | Building your dashboard… | Preparando tu panel… | Montando seu painel… |
| `finishingSubtitle` | Almost there — finishing your dashboard. | Ya casi — terminando tu panel. | Quase lá — finalizando seu painel. |
| `loadingStatusAria` | Loading status | Estado de carga | Status do carregamento |
| `commitmentLabel` | Say this once, out loud: | Di esto una vez, en voz alta: | Diga isto uma vez, em voz alta: |
| `commitmentText` | I have named what I want, and I will not abandon it when doubt shows up. I commit to giving my desire my voice, my attention, and my follow-through. I will not wait to feel ready — I will act like the person who is already on this path. What I want deserves more than a passing thought; it deserves my full yes. | He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Me comprometo a darle a mi deseo mi voz, mi atención y mi constancia. No esperaré a sentir que ya es el momento — actuaré como la persona que ya está en este camino. Lo que quiero merece más que un pensamiento pasajero; merece mi sí completo. | Eu nomeei o que quero e não vou abandonar isso quando a dúvida aparecer. Eu me comprometo a dar ao meu desejo minha voz, minha atenção e minha constância. Não vou esperar sentir que chegou a hora — vou agir como a pessoa que já está neste caminho. O que eu quero merece mais que um pensamento passageiro; merece meu sim completo. |

### 5b. `simsLines` (array index 0–4)

| Index | English | es-419 | pt-BR |
|-------|---------|--------|-------|
| `simsLines.0` | Making it official — membership locked in, overthinking not required. | Membresía confirmada — oficial. | Assinatura confirmada — oficial. |
| `simsLines.1` | Writing affirmations from your setup — we actually used your answers. | Creando afirmaciones con tus respuestas. | Criando afirmações com suas respostas. |
| `simsLines.2` | Giving your affirmations a voice — loop-friendly by design. | Dando voz a tus afirmaciones. | Dando voz às suas afirmações. |
| `simsLines.3` | Layering sound, whispers & theta into your starter track… | Mezclando sonido, susurros y theta… | Misturando som, sussurros e theta… |
| `simsLines.4` | Unlocking your dashboard — built from everything you shared, almost there. | Desbloqueando tu panel… | Desbloqueando seu painel… |

### 5c. Toasts

| i18n key | English | es-419 | pt-BR |
|----------|---------|--------|-------|
| `toastActivateFailedIos` | Purchase completed, but we could not activate your plan yet. Try again from subscriptions. | Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo desde suscripciones. | Compra concluída, mas ainda não conseguimos ativar seu plano. Tente novamente em Assinaturas. |
| `toastActivateFailedAndroid` | Purchase completed, but we could not activate your plan yet. Please try again. | Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo. | Compra concluída, mas ainda não conseguimos ativar seu plano. Tente novamente. |
| `toastSetupSnag` | We hit a snag finishing setup. Taking you to the dashboard… | Tuvimos un problema al terminar la configuración. Te llevaremos al panel… | Tivemos um problema ao finalizar a configuração. Vamos levar você para o painel… |

---

## 6. Hardcoded English still at runtime

| File path | Source location | English string | es-419 | pt-BR | Source type |
|-----------|-----------------|----------------|--------|-------|-------------|
| `src/pages/ManifestationRoutineSettings.tsx` | `toast.error(...)` ~line 592–595 when `step === "bootstrap_onesignal" && message` | `Routine notification setup failed at ${step}: ${message}` | — | — | TypeScript hardcoded |
| `src/pages/ManifestationRoutineSettings.tsx` | `toast.error(...)` ~line 592–595 fallback | `Routine notification setup failed at ${step}. Check native logs.` | — | — | TypeScript hardcoded |
| `src/pages/onboarding/setup/Guide.tsx` | `name: "River"` (guide card) | River | — | — | TypeScript hardcoded |
| `src/pages/onboarding/setup/Guide.tsx` | `name: "Sage"` (guide card) | Sage | — | — | TypeScript hardcoded |
| `src/pages/onboarding/setup/Guide.tsx` | `name: "Rose"` (guide card) | Rose | — | — | TypeScript hardcoded |
| `src/pages/onboarding/setup/Guide.tsx` | `name: "Oliver"` (guide card) | Oliver | — | — | TypeScript hardcoded |
| `src/lib/locale.ts` | `LANGUAGE_SWITCHER_OPTIONS[0].label` | English | — | — | TypeScript hardcoded (intentional) |
| `src/lib/locale.ts` | `LANGUAGE_SWITCHER_OPTIONS[1].label` | — | Español | — | TypeScript hardcoded (intentional) |
| `src/lib/locale.ts` | `LANGUAGE_SWITCHER_OPTIONS[2].label` | — | — | Português | TypeScript hardcoded (intentional) |

**Note:** Guide theme bubbles and descriptions use i18n (`tools:double.choose.themes.*`) — only character **names** above are hardcoded English.

---

## 7. OneSignal notification templates / payload copy currently used

**There are no OneSignal dashboard message templates for routine reminders.** Copy is built in code and sent via the OneSignal REST API on each send. The dashboard is used for app config, segments/tags, and `User.setLanguage` — not for storing routine push title/body text.

### 7a. Routine manifestation reminder push

**Edge function:** `supabase/functions/send-routine-push-notifications/index.ts`  
**Copy module:** `supabase/functions/_shared/pushLocale.ts` → `multilingualRoutinePushFields()`  
**API:** `POST https://api.onesignal.com/notifications`  
**Source type:** OneSignal API payload (from Supabase edge function)

#### Title / heading (OneSignal field: `headings`)

| OneSignal language key | Maps from app locale | English text | es-419 text | pt-BR text |
|------------------------|----------------------|--------------|-------------|------------|
| `en` | `en` | Time to manifest! | — | — |
| `es` | `es-419` | — | ¡Hora de manifestar! | — |
| `pt` | `pt-BR` | — | — | Hora de manifestar! |

#### Subtitle (OneSignal field: `subtitle`)

| OneSignal language key | Maps from app locale | English text | es-419 text | pt-BR text |
|------------------------|----------------------|--------------|-------------|------------|
| `en` | `en` | Get back into the app to manifest | — | — |
| `es` | `es-419` | — | Vuelve a la app | — |
| `pt` | `pt-BR` | — | — | Volte para o app |

#### Body (OneSignal field: `contents`)

| OneSignal language key | Maps from app locale | English text | es-419 text | pt-BR text |
|------------------------|----------------------|--------------|-------------|------------|
| `en` | `en` | Your dreams are waiting. Let's return to your manifesting practice now. | — | — |
| `es` | `es-419` | — | Tu deseo te espera. Entra y retoma tu rutina. | — |
| `pt` | `pt-BR` | — | — | Seu desejo te espera. Entre e retome sua rotina. |

#### Launch URL / deep link

| Setting | Value | Source |
|---------|-------|--------|
| OneSignal payload field | `url` | `send-routine-push-notifications/index.ts` |
| Default deep link | `capacitor://localhost/dashboard` | `const DEFAULT_DEEP_LINK` in edge function |
| Override env var | `ROUTINE_PUSH_DEEP_LINK_URL` | If set in Supabase secrets, replaces default |

#### Sounds

| Platform | OneSignal field | Value |
|----------|-----------------|-------|
| iOS | `ios_sound` | `celestial_bloom.wav` |
| Android | `android_sound` | `celestial_bloom` |

#### Full JSON payload shape (copy fields only)

```json
{
  "headings": {
    "en": "Time to manifest!",
    "es": "¡Hora de manifestar!",
    "pt": "Hora de manifestar!"
  },
  "subtitle": {
    "en": "Get back into the app to manifest",
    "es": "Vuelve a la app",
    "pt": "Volte para o app"
  },
  "contents": {
    "en": "Your dreams are waiting. Let's return to your manifesting practice now.",
    "es": "Tu deseo te espera. Entra y retoma tu rutina.",
    "pt": "Seu desejo te espera. Entre e retome sua rotina."
  },
  "url": "capacitor://localhost/dashboard"
}
```

(Plus `app_id`, `include_aliases`, `target_channel`, `ios_sound`, `android_sound` — not copy.)

---

### 7b. Help request reply push

**Edge function:** `supabase/functions/send-help-request-reply-push/index.ts`  
**Copy module:** `supabase/functions/_shared/pushLocale.ts` → `multilingualHelpReplyContents()`  
**Source type:** OneSignal API payload (from Supabase edge function)

#### Title / heading (OneSignal field: `headings`)

| OneSignal language key | English text | es-419 text | pt-BR text |
|------------------------|--------------|-------------|------------|
| `en` only | Palette Plotting | — | — |

No `es` or `pt` heading is sent for help-reply pushes.

#### Subtitle

Not sent for help-reply pushes.

#### Body (OneSignal field: `contents`)

| OneSignal language key | Maps from app locale | English text | es-419 text | pt-BR text |
|------------------------|----------------------|--------------|-------------|------------|
| `en` | `en` | We replied to your help request. | — | — |
| `es` | `es-419` | — | Ya respondimos tu solicitud. | — |
| `pt` | `pt-BR` | — | — | Já respondemos sua solicitação. |

#### Launch URL / deep link

| Setting | Value |
|---------|-------|
| OneSignal payload field | `url` |
| Pattern | `paletteplotting://help-request/{caseId}` |
| Built by | `helpRequestDeepLink(caseId)` in `send-help-request-reply-push/index.ts` |

#### Sounds

Same as routine push: `ios_sound: celestial_bloom.wav`, `android_sound: celestial_bloom`.

---

### 7c. Locale mapping behavior (English, es-419, pt-BR)

#### App locale → OneSignal language key

**File:** `src/lib/locale.ts` → `oneSignalLanguageForApp()`  
**Also:** `supabase/functions/_shared/pushLocale.ts` → `oneSignalLangKey()`

| App locale (`preferred_locale` / i18n) | OneSignal `setLanguage` code | OneSignal payload keys (`headings`, `subtitle`, `contents`) |
|----------------------------------------|------------------------------|-------------------------------------------------------------|
| `en` | `en` | `en` |
| `es-419` | `es` | `es` |
| `pt-BR` | `pt` | `pt` |

#### How the device picks which push language to show

1. **On login / language switch / routine save:** native app calls `OneSignal.User.setLanguage(oneSignalLanguageForApp(locale))` in `src/services/oneSignal.ts` → `syncOneSignalUserLanguage()`.
2. **On routine tag sync:** app also sets tag `preferred_locale` to `en` | `es-419` | `pt-BR` via `syncManifestationRoutineOneSignalTags()`.
3. **On send:** edge function includes **all three** language variants in every routine push payload (`headings.en/es/pt`, `subtitle.en/es/pt`, `contents.en/es/pt`). OneSignal selects the variant matching the user's subscription/device language (set by step 1).
4. **Routine push does not read `preferred_locale` from DB at send time** for copy selection — multilingual fields are always bundled; selection is client-side by OneSignal based on `setLanguage`.
5. **Unknown / missing locale** falls back to English: `resolvePushLocale()` in `pushLocale.ts` returns `"en"` for any value other than `es-419` or `pt-BR`.

#### OneSignal dashboard

Routine and help-reply **message text is not authored in the OneSignal dashboard**. Dashboard may be used for:

- App ID / REST API keys
- Segments based on tags (`preferred_locale`, `manifestation_intensity`, `routine_alert_1`, etc.)
- In-app messages / journeys (separate from routine cron push)

**Deploy note:** After editing `pushLocale.ts`, redeploy `send-routine-push-notifications` and `send-help-request-reply-push` edge functions for production push copy to update.
