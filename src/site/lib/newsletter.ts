import { supabase } from "@/integrations/supabase/client";

export type NewsletterSignupSource = "homepage" | "footer" | "product_page" | "digital_guide";

export type SubscribeNewsletterParams = {
  email: string;
  firstName?: string;
  source: NewsletterSignupSource;
  pagePath?: string;
};

export type SubscribeNewsletterResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function subscribeToPaletteLetter(
  params: SubscribeNewsletterParams,
): Promise<SubscribeNewsletterResult> {
  const { data, error } = await supabase.functions.invoke("subscribe-palette-letter", {
    body: {
      email: params.email,
      firstName: params.firstName,
      source: params.source,
      pagePath: params.pagePath,
    },
  });

  if (error) {
    return { ok: false, error: "Could not join the list right now. Please try again." };
  }

  const payload = data as { ok?: boolean; message?: string; error?: string } | null;
  if (!payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "Could not join the list right now. Please try again.",
    };
  }

  return {
    ok: true,
    message:
      payload.message ?? "You're on the list. Watch for The Palette Letter in your inbox.",
  };
}
