/** Supported app locales for edge functions (Brevo, push copy, etc.). */
export type AppLocale = "en" | "es-419" | "pt-BR";

export function resolveAppLocale(raw: unknown): AppLocale {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "es-419" || v === "pt-BR" || v === "en") return v;
  return "en";
}

/** Resolve locale from request body, then user_preferences, then profiles. */
export async function resolveUserAppLocale(
  supabase: { from: (table: string) => unknown },
  userId: string | null | undefined,
  bodyLocale: unknown,
): Promise<AppLocale> {
  if (typeof bodyLocale === "string" && bodyLocale.trim()) {
    const fromBody = resolveAppLocale(bodyLocale);
    if (fromBody !== "en" || bodyLocale.trim() === "en") return fromBody;
  }
  if (!userId) return "en";
  const client = supabase as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { preferred_locale?: string | null } | null }>;
        };
      };
    };
  };
  const { data: prefs } = await client
    .from("user_preferences")
    .select("preferred_locale")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefs?.preferred_locale) return resolveAppLocale(prefs.preferred_locale);
  const { data: profile } = await client
    .from("profiles")
    .select("preferred_locale")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.preferred_locale) return resolveAppLocale(profile.preferred_locale);
  return "en";
}
