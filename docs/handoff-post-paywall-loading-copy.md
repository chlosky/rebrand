# Handoff: Post-paywall loading screen copy (en / es-419 / pt-BR)

Updated 2026-06-09 (es-419 / pt-BR polish approved). Source of truth: `src/i18n/locales/{en,es-419,pt-BR}/paywall.json` → `postPaywall` namespace.

**Screen:** `src/pages/onboarding/PostPaywallLoading.tsx`  
**Android variant:** `src/pages/onboarding/AndroidPostPaywallLoading.tsx` (same `paywall` namespace)

---

## Keys used on screen

| Key | UI use |
|-----|--------|
| `postPaywall.title` | Main heading |
| `postPaywall.buildingDashboard` | Label above progress ring |
| `postPaywall.finishingSubtitle` | Subtitle when phase = finishing |
| `postPaywall.commitmentLabel` | Label above commitment block |
| `postPaywall.commitmentText` | Commitment paragraph (read out loud) |
| `postPaywall.simsLines` | Array of 5 rotating status lines |
| `postPaywall.loadingStatusAria` | Defined in JSON; check component if wired |
| `postPaywall.toastActivateFailedIos` | Toast if iOS plan activation fails after purchase |
| `postPaywall.toastActivateFailedAndroid` | Toast if Android plan activation fails |
| `postPaywall.toastSetupSnag` | Toast if provisioning fails; still routes to dashboard |

---

## English (reference) — `src/i18n/locales/en/paywall.json`

**title**  
Your path is ready

**buildingDashboard**  
Building your dashboard…

**finishingSubtitle**  
Almost there — finishing your dashboard.

**loadingStatusAria**  
Loading status

**commitmentLabel**  
Say this once, out loud:

**commitmentText**  
I have named what I want, and I will not abandon it when doubt shows up. I commit to giving my desire my voice, my attention, and my follow-through. I will not wait to feel ready — I will act like the person who is already on this path. What I want deserves more than a passing thought; it deserves my full yes.

**simsLines** (in order, 5 lines)
1. Making it official — membership locked in, overthinking not required.
2. Writing affirmations from your setup — we actually used your answers.
3. Giving your affirmations a voice — loop-friendly by design.
4. Layering sound, whispers & theta into your starter track…
5. Unlocking your dashboard — built from everything you shared, almost there.

**toastActivateFailedIos**  
Purchase completed, but we could not activate your plan yet. Try again from subscriptions.

**toastActivateFailedAndroid**  
Purchase completed, but we could not activate your plan yet. Please try again.

**toastSetupSnag**  
We hit a snag finishing setup. Taking you to the dashboard…

---

## es-419 — `src/i18n/locales/es-419/paywall.json`

**title**  
Tu camino está listo

**buildingDashboard**  
Preparando tu panel…

**finishingSubtitle**  
Ya casi — terminando tu panel.

**loadingStatusAria**  
Estado de carga

**commitmentLabel**  
Di esto una vez, en voz alta:

**commitmentText**  
He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Me comprometo a darle a mi deseo mi voz, mi atención y mi constancia. No esperaré a sentir que ya es el momento — actuaré como la persona que ya está en este camino. Lo que quiero merece más que un pensamiento pasajero; merece mi sí completo.

**simsLines** (in order, 5 lines)
1. Membresía confirmada — oficial.
2. Creando afirmaciones con tus respuestas.
3. Dando voz a tus afirmaciones.
4. Mezclando sonido, susurros y theta…
5. Desbloqueando tu panel…

**toastActivateFailedIos**  
Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo desde suscripciones.

**toastActivateFailedAndroid**  
Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo.

**toastSetupSnag**  
Tuvimos un problema al terminar la configuración. Te llevaremos al panel…

---

## pt-BR — `src/i18n/locales/pt-BR/paywall.json`

**title**  
Seu caminho está pronto

**buildingDashboard**  
Montando seu painel…

**finishingSubtitle**  
Quase lá — finalizando seu painel.

**loadingStatusAria**  
Status do carregamento

**commitmentLabel**  
Diga isto uma vez, em voz alta:

**commitmentText**  
Eu nomeei o que quero e não vou abandonar isso quando a dúvida aparecer. Eu me comprometo a dar ao meu desejo minha voz, minha atenção e minha constância. Não vou esperar sentir que chegou a hora — vou agir como a pessoa que já está neste caminho. O que eu quero merece mais que um pensamento passageiro; merece meu sim completo.

**simsLines** (in order, 5 lines)
1. Assinatura confirmada — oficial.
2. Criando afirmações com suas respostas.
3. Dando voz às suas afirmações.
4. Misturando som, sussurros e theta…
5. Desbloqueando seu painel…

**toastActivateFailedIos**  
Compra concluída, mas ainda não conseguimos ativar seu plano. Tente novamente em Assinaturas.

**toastActivateFailedAndroid**  
Compra concluída, mas ainda não conseguimos ativar seu plano. Tente novamente.

**toastSetupSnag**  
Tivemos um problema ao finalizar a configuração. Vamos levar você para o painel…

---

## Notes for review

- **simsLines:** English lines are longer and more playful; es-419 and pt-BR are shorter and more direct. Same 5-step structure on all locales.
- **commitmentText:** es-419 and pt-BR use natural say-out-loud copy (updated from earlier handoff work).
- **Ellipsis:** English uses `…` (unicode ellipsis) in several strings; es/pt match that style where applicable.
- Edits go in the three `paywall.json` files under `postPaywall`; no separate copy file.
