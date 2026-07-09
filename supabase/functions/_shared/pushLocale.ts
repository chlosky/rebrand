/** Routine push copy — keys must match app locales + OneSignal language codes. */
export const ROUTINE_PUSH_COPY: Record<
  "en" | "es-419" | "pt-BR",
  { heading: string; subtitle: string; body: string }
> = {
  en: {
    heading: "Board check-in",
    subtitle: "Open palette plotting",
    body: "A few minutes on your boards keeps your plan moving. Jump back in when you're ready.",
  },
  "es-419": {
    heading: "Revisión de tableros",
    subtitle: "Abre palette plotting",
    body: "Unos minutos en tus tableros mantienen tu plan en marcha. Vuelve cuando quieras.",
  },
  "pt-BR": {
    heading: "Revisão dos boards",
    subtitle: "Abra o palette plotting",
    body: "Alguns minutos nos seus boards mantêm o plano em movimento. Volte quando quiser.",
  },
};

/** Inbox help-reply push — same headings / subtitle / contents shape as routine pushes. */
export const HELP_REPLY_PUSH_COPY: Record<
  "en" | "es-419" | "pt-BR",
  { heading: string; subtitle: string; body: string }
> = {
  en: {
    heading: "palette plotting",
    subtitle: "Check your inbox",
    body: "We replied to your help request.",
  },
  "es-419": {
    heading: "palette plotting",
    subtitle: "Revisa tu bandeja",
    body: "Respondimos a tu solicitud de ayuda.",
  },
  "pt-BR": {
    heading: "palette plotting",
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
