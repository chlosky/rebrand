# Palette Plotting app copy — Español (Latinoamérica, es-419) — propuesta de cambios

Este documento es solo para aprobación editorial antes de implementar cambios en `es-419`.

- No se modificó ningún archivo de locale del runtime.
- El runtime `src/i18n/locales/es-419/*.json` está bastante bien y necesita una pasada puntual, no una reescritura completa.
- El handoff actual `docs/locale-handoff/app-copy-es-419.md` está desactualizado en varias secciones y todavía muestra bloques viejos en inglés, así que no conviene usarlo como versión final hasta volver a sincronizarlo.
- Dirección aprobada con condiciones: las cadenas finales deben aplicarse con acentos correctos en runtime.
- Decisión editorial propuesta para esta pasada: mantener `set/sets de afirmaciones` como jerga del producto, de forma consistente. No mezclar aleatoriamente con `conjunto/conjuntos de afirmaciones`.

---

## Condiciones para aplicar

1. No aplicar ninguna cadena sin acentos.
   Las cadenas finales deben conservar acentos correctos: `aprobación`, `técnicas`, `manifestación`, `guía`, `hábitos`, `función`, `suscríbete`, `términos`, `política`, `asunción`, `acción`, `aquí`, `método`, `solía`, `más`.

2. Aplicar estas correcciones principales:
   - quitar `momentum`
   - quitar `checkout`
   - quitar `typewriter`
   - quitar `Text-to-Speech`
   - traducir las etiquetas del footer/legal
   - cambiar `Manifiesta en modo fácil` por `Manifiesta con facilidad`
   - cambiar `Personalizando tu sistema inicial` por `Personalizando tu configuración inicial`
   - usar `tu guía` en lugar de `la guía` cuando el personaje puede ser cualquiera
   - usar `Trabajo con espejo` de forma consistente

3. Para esta cadena:
   - `Tu guía de IA para darte impulso en los chats`
   usar en su lugar:
   - `Tu guía de IA para acompañarte en los chats`

4. No reabrir `Ajustes` vs `Configuración` en esta pasada salvo que se haga globalmente.
   `Configuración inicial` sí funciona bien en onboarding, pero no conviene mezclar `Ajustes` y `Configuración` como etiquetas de navegación si no habrá una migración completa.

5. Después de aplicar los cambios, regenerar el handoff desde runtime y confirmar:
   - no quedan oraciones completas en inglés dentro de `es-419`
   - todas las cadenas visibles en español tienen acentos
   - los términos en inglés restantes son intencionales
   - se entrega una lista de `changed keys`

---

## Cambios propuestos en runtime

### `src/i18n/locales/es-419/marketing.json`

- `pricing.features.affirmations.title`
  Actual: `Afirmar robóticamente y escribir tu vida`
  Propuesta: `Afirmar y escribir`

- `pricing.features.journal.description`
  Actual: `Escribe en tu diario, documenta acción inspirada y sigue tu progreso con listas de manifestación.`
  Propuesta: `Escribe en tu diario, documenta tus acciones inspiradas y sigue tu progreso con listas de manifestación.`

- `faq.items.whatIs.answer`
  Actual: `... generar momentum ...`
  Propuesta: `... ganar impulso ...`

- `home.practiceSection.pills[*].category`
  Actual: `Self Concept`, `Law of Assumption`
  Propuesta: `Autoconcepto`, `Ley de la asunción`

- `home.testimonials.items[0].quote`
  Actual: `... scripting y mirror work aquí ... scrollear manifest TikTok ...`
  Propuesta: `... scripting y trabajo con espejo aquí ... quedarme scrolleando TikToks de manifestación ...`

- `home.footer.copyright`
  Actual: `© {{year}} Palette Plotting LLC. All rights reserved.`
  Propuesta: `© {{year}} Palette Plotting LLC. Todos los derechos reservados.`

- `home.footer.terms`
  Actual: `Terms of Use`
  Propuesta: `Términos de uso`

- `home.footer.privacy`
  Actual: `Privacy Policy`
  Propuesta: `Política de privacidad`

- `home.footer.acceptableUse`
  Actual: `Acceptable Use Policy`
  Propuesta: `Política de uso aceptable`

### `src/i18n/locales/es-419/onboarding.json`

- `welcome.nativeDescription`
  Actual: `Manifiesta en modo fácil ...`
  Propuesta: `Manifiesta con facilidad ...`

- `setup.toolPreferenceOptions.daily_wins_progress`
  Actual: `Seguir constancia y progreso`
  Propuesta: `Dar seguimiento a tu constancia y progreso`

- `setup.guide.title`
  Actual: `Elige una guía`
  Propuesta: `Elige tu guía`

- `setup.guide.subtitle`
  Actual: `Una guía de IA para responder tus preguntas de manifestación.`
  Propuesta: `Tu guía de IA para responder tus preguntas de manifestación.`

- `setup.manifestationIntensity.notificationsQuestion`
  Actual: `¿Quieres notificaciones en la app y push para volver a tu rutina?`
  Propuesta: `¿Quieres recibir notificaciones en la app y notificaciones push para retomar tu rutina?`

- `setup.plotSynthesis.items.guideReady`
  Actual: `{{name}} está lista para guiarte.`
  Propuesta: `{{name}} está aquí para guiarte.`

- `setup.plotSynthesis.items.guideReadyGeneric`
  Actual: `Tu guía está lista para guiarte.`
  Propuesta: `Tu guía está aquí para guiarte.`

- `setup.plotLoading.subtitle`
  Actual: `Personalizando tu sistema inicial.`
  Propuesta: `Personalizando tu configuración inicial.`

- `legacy.double.title`
  Actual: `Elige una guía`
  Propuesta: `Elige tu guía`

- `legacy.double.subtitle`
  Actual: `Una guía de IA para impulsar tu momentum en los chats`
  Propuesta: `Tu guía de IA para acompañarte en los chats`

- `legacy.habitTracking.title`
  Actual: `Seguimiento de hábitos y momentum`
  Propuesta: `Seguimiento de hábitos y progreso`

- `legacy.habitTracking.imageAlt`
  Actual: `Seguimiento de hábitos y momentum`
  Propuesta: `Seguimiento de hábitos y progreso`

### `src/i18n/locales/es-419/settings.json`

- `routine.pushRemindersLabel`
  Actual: `Recordatorios en la app y push`
  Propuesta: `Recordatorios en la app y notificaciones push`

- `toasts.playSubscriptionsFailed`
  Actual: `No se pudo abrir las suscripciones de Google Play.`
  Propuesta: `No se pudo abrir la pantalla de suscripciones de Google Play.`

### `src/i18n/locales/es-419/dashboard.json`

- `nav.talkToGuide`
  Actual: `Hablar con la guía`
  Propuesta: `Hablar con tu guía`

- `tools.yourJourney.description`
  Actual: `Diario, reflexiones y chat con la guía`
  Propuesta: `Diario, reflexiones y chat con tu guía`

- `supportTools.talkToGuide`
  Actual: `Hablar con la guía (chat)`
  Propuesta: `Hablar con tu guía (chat)`

- `billingChannels.web`
  Actual: `Web (tarjeta / checkout)`
  Propuesta: `Web (tarjeta / proceso de pago)`

### `src/i18n/locales/es-419/tools.json`

- `demo.subliminal.walkthrough.record.message`
  Actual: `Elige modo Freestyle o Karaoke para grabar tus afirmaciones. Text-to-Speech está disponible para suscriptores de pago.`
  Propuesta: `Elige el modo Freestyle o Karaoke para grabar tus afirmaciones. La función de texto a voz está disponible para suscriptores de pago.`

- `demo.subliminal.walkthrough.signup.message`
  Actual: `... seguimiento de impulso/metas y hábitos ...`
  Propuesta: `... seguimiento de metas, progreso y hábitos ...`

- `double.choose.dailyPracticeChoices`
  Actual: `Elecciones de acciones inspiradas`
  Propuesta: `Selección de acciones inspiradas`

- `double.choose.chooseGuideSubtitle`
  Actual: `Selecciona un personaje para ser tu guía diaria`
  Propuesta: `Selecciona un personaje para acompañarte todos los días`

- `affirmationVisualizer.scriptingSpeedHint`
  Actual: `... el ritmo del typewriter.`
  Propuesta: `... el ritmo del efecto de máquina de escribir.`

- `musicComposer.toasts.subscribersOnly`
  Actual: `Fondos subliminales es solo para suscriptores. Suscríbete para acceder.`
  Propuesta: `Los fondos subliminales son exclusivos para suscriptores. Suscríbete para acceder.`

### `src/i18n/locales/es-419/paywall.json`

- `legacyAndroid.title`
  Actual: `Desbloquea tu sistema de manifestación hoy.`
  Propuesta: `Desbloquea tus herramientas de manifestación hoy.`

---

## Sincronización pendiente del handoff

El documento actual `docs/locale-handoff/app-copy-es-419.md` no está bien sincronizado con el runtime. Después de aplicar los cambios aprobados, hay que regenerarlo o actualizarlo.

Secciones del handoff que hoy siguen mostrando texto viejo o inglés:

- `tools > subliminal`
- `tools > affirmations > toasts`
- `tools > refactor`
- `tools > musicComposer > toasts`
- `dashboard > home > defaultName`

Ejemplos de copy que deberían verse correctamente una vez sincronizado:

- `Texto a voz requiere una mejora de plan. Mejora tu plan para acceder.`
- `No se pudieron cargar los sets de afirmaciones. Inténtalo de nuevo.`
- `Selecciona un modo (Eliminar o Integrar)`
- `No se pudieron cargar las pistas`

---

## Términos que sí dejaría tal cual

Estos términos no me preocupan para `es-419` y los dejaría como están:

- `SP`
- `3D`
- `scripting`
- `set de afirmaciones`
- `sets de afirmaciones`
- `Piano Tapping`
- `Tap-in`
- `FAQ`

---

## Siguiente paso sugerido

Si este texto te parece bien para aprobación, el siguiente paso sería:

1. Aplicar solo estos cambios de copy a `src/i18n/locales/es-419/*.json`.
2. Volver a sincronizar `docs/locale-handoff/app-copy-es-419.md`.
3. Hacer una pasada final de QA sobre el handoff ya regenerado, confirmando que no quedan oraciones completas en inglés y que todas las cadenas visibles en español conservan sus acentos.
