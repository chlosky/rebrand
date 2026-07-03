/** Routine manifestation push copy — keys must match app locales + OneSignal language codes. */
export const ROUTINE_PUSH_COPY: Record<
  "en" | "es-419" | "pt-BR",
  { heading: string; subtitle: string; body: string }
> = {
  en: {
    heading: "Time to manifest!",
    subtitle: "Get back into the app to manifest",
    body: "Your dreams are waiting. Let's return to your manifesting practice now.",
  },
  "es-419": {
    heading: "¡Hora de manifestar!",
    subtitle: "Vuelve a la app",
    body: "Tu deseo te espera. Entra y retoma tu rutina.",
  },
  "pt-BR": {
    heading: "Hora de manifestar!",
    subtitle: "Volte para o app",
    body: "Seu desejo te espera. Entre e retome sua rotina.",
  },
};

/** Inbox help-reply push — same headings / subtitle / contents shape as routine pushes. */
export const HELP_REPLY_PUSH_COPY: Record<
  "en" | "es-419" | "pt-BR",
  { heading: string; subtitle: string; body: string }
> = {
  en: {
    heading: "Palette Plotting",
    subtitle: "Check your inbox",
    body: "We replied to your help request.",
  },
  "es-419": {
    heading: "Palette Plotting",
    subtitle: "Revisa tu bandeja",
    body: "Respondimos a tu solicitud de ayuda.",
  },
  "pt-BR": {
    heading: "Palette Plotting",
    subtitle: "Confira sua caixa",
    body: "Respondemos ao seu pedido de ajuda.",
  },
};

export function resolvePushLocale(raw: string | null | undefined): "en" | "es-419" | "pt-BR" {
  const v = (raw ?? "").trim();
  if (v === "es-419" || v === "pt-BR" || v === "en") return v;
  return "en";
}

/** OneSignal `headings` / `contents` language keys (en, es, pt). */
export function oneSignalLangKey(locale: "en" | "es-419" | "pt-BR"): "en" | "es" | "pt" {
  if (locale === "es-419") return "es";
  if (locale === "pt-BR") return "pt";
  return "en";
}

/** Send all paywall locales so OneSignal can match device or subscription language. */
export function multilingualRoutinePushFields() {
  return {
    headings: {
      en: ROUTINE_PUSH_COPY.en.heading,
      es: ROUTINE_PUSH_COPY["es-419"].heading,
      pt: ROUTINE_PUSH_COPY["pt-BR"].heading,
    },
    subtitle: {
      en: ROUTINE_PUSH_COPY.en.subtitle,
      es: ROUTINE_PUSH_COPY["es-419"].subtitle,
      pt: ROUTINE_PUSH_COPY["pt-BR"].subtitle,
    },
    contents: {
      en: ROUTINE_PUSH_COPY.en.body,
      es: ROUTINE_PUSH_COPY["es-419"].body,
      pt: ROUTINE_PUSH_COPY["pt-BR"].body,
    },
  };
}

export function multilingualHelpReplyPushFields() {
  return {
    headings: {
      en: HELP_REPLY_PUSH_COPY.en.heading,
      es: HELP_REPLY_PUSH_COPY["es-419"].heading,
      pt: HELP_REPLY_PUSH_COPY["pt-BR"].heading,
    },
    subtitle: {
      en: HELP_REPLY_PUSH_COPY.en.subtitle,
      es: HELP_REPLY_PUSH_COPY["es-419"].subtitle,
      pt: HELP_REPLY_PUSH_COPY["pt-BR"].subtitle,
    },
    contents: {
      en: HELP_REPLY_PUSH_COPY.en.body,
      es: HELP_REPLY_PUSH_COPY["es-419"].body,
      pt: HELP_REPLY_PUSH_COPY["pt-BR"].body,
    },
  };
}
