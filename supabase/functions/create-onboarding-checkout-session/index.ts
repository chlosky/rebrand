import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// NOTE: We intentionally inline this helper instead of importing from ../_shared
// because the Supabase deploy bundler does not always include sibling directories.
function getPriceIdForTier(tier: "basic" | "plus" | "premium", billing: "monthly" | "annual" | "weekly"): string {
  const config: Record<
    "basic" | "plus" | "premium",
    Record<"monthly" | "annual" | "weekly", string>
  > = {
    basic: {
      monthly: Deno.env.get("STRIPE_PRICE_BASIC_MONTHLY") || "",
      annual: Deno.env.get("STRIPE_PRICE_BASIC_ANNUAL") || "",
      weekly: "",
    },
    plus: {
      monthly: Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY") || "",
      annual: Deno.env.get("STRIPE_PRICE_PLUS_ANNUAL") || "",
      weekly: "",
    },
    premium: {
      monthly: Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") || "",
      annual: Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL") || "",
      weekly: Deno.env.get("STRIPE_PRICE_PREMIUM_WEEKLY") || "",
    },
  };
  return config[tier][billing];
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function encodeValue(value: string) {
  return encodeURIComponent(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: obSession, error: obErr } = await supabase
      .from("onboarding_sessions")
      .select("id,resume_token_hash,status,email,selected_tier,billing,user_id")
      .eq("id", String(sessionId))
      .maybeSingle();

    if (obErr || !obSession) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (obSession.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = obSession.selected_tier as "basic" | "plus" | "premium" | null;
    const billing = obSession.billing as "monthly" | "annual" | "weekly" | null;
    if (!tier || !billing) {
      console.error("Plan not selected in session:", { sessionId, selected_tier: tier, billing });
      return new Response(
        JSON.stringify({ 
          error: "Plan not selected",
          details: `Session has tier: ${tier}, billing: ${billing}. Please select a plan first.`
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const priceId = getPriceIdForTier(tier, billing);
    if (!priceId || !priceId.startsWith("price_")) {
      return new Response(JSON.stringify({ error: "Price ID not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestOrigin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");

    // Stripe success redirect goes to payment processing page first (waits for webhook)
    const successUrl = `${baseUrl}/payment-processing?sid=${encodeURIComponent(String(sessionId))}&token=${encodeURIComponent(
      String(resumeToken),
    )}`;
    const cancelUrl = `${baseUrl}/onboarding/web-paywall`;

    // Create Stripe Checkout Session
    const formParts: string[] = [];
    formParts.push(`mode=${encodeValue("subscription")}`);
    formParts.push(`line_items[0][price]=${encodeValue(priceId)}`);
    formParts.push(`line_items[0][quantity]=${encodeValue("1")}`);
    formParts.push(`success_url=${encodeValue(successUrl)}`);
    formParts.push(`cancel_url=${encodeValue(cancelUrl)}`);
    
    // Prefill email if available
    if (obSession?.email) {
      formParts.push(`customer_email=${encodeValue(obSession.email)}`);
    }

    // Link back to onboarding session
    formParts.push(`client_reference_id=${encodeValue(String(sessionId))}`);
    formParts.push(`metadata[onboarding_session_id]=${encodeValue(String(sessionId))}`);
    formParts.push(`metadata[tier]=${encodeValue(tier)}`);
    formParts.push(`metadata[billing]=${encodeValue(billing)}`);
    // Subscription metadata: RevenueCat Stripe integration + renewal webhooks
    formParts.push(`subscription_data[metadata][onboarding_session_id]=${encodeValue(String(sessionId))}`);
    formParts.push(`subscription_data[metadata][tier]=${encodeValue(tier)}`);
    formParts.push(`subscription_data[metadata][billing]=${encodeValue(billing)}`);
    const obUserId = typeof obSession.user_id === "string" ? obSession.user_id.trim() : "";
    if (obUserId) {
      formParts.push(`metadata[user_id]=${encodeValue(obUserId)}`);
      formParts.push(`metadata[app_user_id]=${encodeValue(obUserId)}`);
      formParts.push(`subscription_data[metadata][user_id]=${encodeValue(obUserId)}`);
      formParts.push(`subscription_data[metadata][app_user_id]=${encodeValue(obUserId)}`);
    }

    // 3-day trial for monthly web subscription (auto-renews after trial when card is on file).
    if (billing === "monthly") {
      const trialDays = (Deno.env.get("STRIPE_TRIAL_DAYS") || "3").trim();
      formParts.push(`payment_method_collection=${encodeValue("always")}`);
      formParts.push(`subscription_data[trial_period_days]=${encodeValue(trialDays)}`);
      formParts.push(
        `subscription_data[trial_settings][end_behavior][missing_payment_method]=${encodeValue("cancel")}`,
      );
    }

    // Enable promo codes in Checkout
    formParts.push(`allow_promotion_codes=true`);

    const formBody = formParts.join("&");

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("Stripe checkout session error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await sessionResponse.json();

    // Save checkout session ID + status (do not mark paid here; webhook is source of truth)
    const { error: updateErr } = await supabase
      .from("onboarding_sessions")
      .update({
        stripe_checkout_session_id: session.id,
        status: "checkout_created",
      })
      .eq("id", String(sessionId));

    if (updateErr) {
      console.error("Error updating onboarding session with checkout id:", updateErr);
      // non-fatal; user can still complete checkout
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in create-onboarding-checkout-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

