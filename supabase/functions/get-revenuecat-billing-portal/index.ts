import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  subscriberHasActiveWebBilling,
  webBillingManagementUrlFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(JSON.stringify({ url: null, webBilling: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const rc = await fetchRevenueCatSubscriber(secretKey, user.id);
    if (!rc.ok) {
      console.warn("[get-revenuecat-billing-portal] RevenueCat API error:", rc.status);
      return new Response(JSON.stringify({ url: null, webBilling: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webBilling = subscriberHasActiveWebBilling(rc.data.subscriber);
    const url = webBillingManagementUrlFromRevenueCatPayload(rc.data);
    return new Response(JSON.stringify({ url, webBilling }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-revenuecat-billing-portal:", error);
    return new Response(JSON.stringify({ url: null, webBilling: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});
