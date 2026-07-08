import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  GUIDE_SECTIONS,
  corsHeaders,
  hasGuideEntitlement,
  readSessionEmail,
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

  try {
    const secret = Deno.env.get("DIGITAL_SESSION_SECRET");
    if (!secret) return json({ authenticated: false, entitled: false });

    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

    const email = await readSessionEmail(secret, token);
    if (!email) return json({ authenticated: false, entitled: false });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const entitled = await hasGuideEntitlement(supabase, email);

    return json({
      authenticated: true,
      entitled,
      email,
      firstSection: GUIDE_SECTIONS[0].slug,
    });
  } catch (e) {
    console.error("digital-session error:", e);
    return json({ authenticated: false, entitled: false });
  }
});
