import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  GUIDE_SECTIONS,
  corsHeaders,
  createSessionToken,
  hasGuideEntitlement,
  isValidEmail,
  normalizeEmail,
} from "../_shared/digitalGuide.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const secret = Deno.env.get("DIGITAL_SESSION_SECRET");
    if (!secret) {
      console.error("DIGITAL_SESSION_SECRET is not configured");
      return json({ error: "Server not configured" }, 500);
    }

    const { email } = await req.json().catch(() => ({ email: "" }));
    if (!email || !isValidEmail(String(email))) {
      return json({ error: "Enter a valid email address." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const entitled = await hasGuideEntitlement(supabase, String(email));
    if (!entitled) {
      return json(
        {
          entitled: false,
          error: "We couldn't find a purchase for that email. Use the email from your receipt.",
        },
        403,
      );
    }

    const token = await createSessionToken(secret, normalizeEmail(String(email)));
    return json({
      entitled: true,
      token,
      email: normalizeEmail(String(email)),
      firstSection: GUIDE_SECTIONS[0].slug,
    });
  } catch (e) {
    console.error("digital-unlock error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
