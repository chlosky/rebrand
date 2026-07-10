import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  GUIDE_SECTIONS,
  guideSectionBySlug,
  hasGuideEntitlement,
  readSessionEmail,
  renderGuideReaderPage,
} from "../_shared/digitalGuide.ts";

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

serve(async (req) => {
  const url = new URL(req.url);
  const readerBase = `${url.origin}${url.pathname}`;
  const homeOrigin = (Deno.env.get("DIGITAL_SITE_ORIGIN") || "https://paletteplotting.com").replace(/\/$/, "");
  const productUrl = `${homeOrigin}/palette-plotting-guide`;

  try {
    const token = url.searchParams.get("token") || "";
    const requestedSlug = url.searchParams.get("section") || GUIDE_SECTIONS[0].slug;

    const secret = Deno.env.get("DIGITAL_SESSION_SECRET");
    if (!secret) {
      console.error("DIGITAL_SESSION_SECRET is not configured");
      return redirect(productUrl);
    }

    const email = await readSessionEmail(secret, token);
    if (!email) {
      return redirect(`${productUrl}?locked=1`);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const entitled = await hasGuideEntitlement(supabase, email);
    if (!entitled) {
      return redirect(`${productUrl}?locked=1`);
    }

    const section = guideSectionBySlug(requestedSlug) ?? GUIDE_SECTIONS[0];
    return htmlResponse(renderGuideReaderPage(section, { readerBase, token, homeOrigin }));
  } catch (e) {
    console.error("guide-reader error:", e);
    return redirect(productUrl);
  }
});
