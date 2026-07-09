import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken, checkoutSessionId } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: session, error } = await supabase
      .from("onboarding_sessions")
      .select(
        "id,resume_token_hash,status,email,first_name,username,app_notifications_consent,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at,expires_at",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (error || !session) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if session is expired (only for unclaimed sessions)
    if (session.expires_at && !session.user_id) {
      const expiresAt = new Date(session.expires_at);
      if (expiresAt < new Date()) {
        return new Response(JSON.stringify({ error: "Session expired" }), {
          status: 410, // Gone
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let resultSession = session as any;

    const currentStatus = String(resultSession.status ?? "");
    const stripeCheckoutSessionId =
      typeof checkoutSessionId === "string" && checkoutSessionId.trim()
        ? checkoutSessionId.trim()
        : typeof resultSession.stripe_checkout_session_id === "string"
          ? resultSession.stripe_checkout_session_id.trim()
          : "";

    if (currentStatus !== "paid" && currentStatus !== "active" && stripeCheckoutSessionId) {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeCheckoutSessionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });

        if (stripeResp.ok) {
          const checkout = await stripeResp.json();
          const clientReferenceId = typeof checkout.client_reference_id === "string" ? checkout.client_reference_id : "";
          const metadataSessionId =
            checkout.metadata && typeof checkout.metadata.onboarding_session_id === "string"
              ? checkout.metadata.onboarding_session_id
              : "";
          const belongsToSession =
            clientReferenceId === String(sessionId) || metadataSessionId === String(sessionId);
          const checkoutOk =
            checkout.status === "complete" &&
            (checkout.payment_status === "paid" ||
              (checkout.mode === "subscription" && checkout.payment_status === "no_payment_required"));

          if (belongsToSession && checkoutOk) {
            const customerId =
              typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null;
            const subscriptionId =
              typeof checkout.subscription === "string"
                ? checkout.subscription
                : checkout.subscription?.id ?? null;
            const customerEmail =
              checkout.customer_details?.email || checkout.customer_email || resultSession.stripe_customer_email || null;
            const tier = checkout.metadata?.tier || resultSession.selected_tier || null;
            const billing = checkout.metadata?.billing || resultSession.billing || null;
            const paidAt = resultSession.paid_at || new Date().toISOString();

            const { data: updated, error: updateError } = await supabase
              .from("onboarding_sessions")
              .update({
                status: "paid",
                stripe_checkout_session_id: stripeCheckoutSessionId,
                stripe_customer_id: customerId,
                stripe_customer_email: customerEmail,
                stripe_subscription_id: subscriptionId,
                selected_tier: tier,
                billing,
                paid_at: paidAt,
                updated_at: new Date().toISOString(),
              })
              .eq("id", String(sessionId))
              .select(
                "id,resume_token_hash,status,email,first_name,username,app_notifications_consent,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at,expires_at",
              )
              .maybeSingle();

            if (!updateError && updated) {
              resultSession = updated;
            } else if (updateError) {
              console.error("Failed to mark onboarding session paid from Stripe verification:", updateError);
            }
          }
        } else {
          console.error("Stripe checkout verification failed in get-onboarding-session:", await stripeResp.text());
        }
      }
    }

    // Do not return resume_token_hash
    const { resume_token_hash: _ignore, ...safeSession } = resultSession;

    return new Response(JSON.stringify({ session: safeSession }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in get-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

