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
  const response = await fetch("/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      firstName: params.firstName,
      source: params.source,
      pagePath: params.pagePath,
    }),
  });

  let payload: { ok?: boolean; message?: string; error?: string };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    return { ok: false, error: "Could not join the list right now. Please try again." };
  }

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.error ?? "Could not join the list right now. Please try again.",
    };
  }

  return {
    ok: true,
    message:
      payload.message ?? "You're on the list. Watch for The Palette Letter in your inbox.",
  };
}
