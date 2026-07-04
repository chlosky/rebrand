import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const { checkoutSessionId } = await req.json();
    if (!checkoutSessionId) {
      return new Response(JSON.stringify({ error: "Missing checkoutSessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check checkout session status directly from Stripe
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${checkoutSessionId}`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stripe API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to verify checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await response.json();

    // Paid checkout, or subscription with trial / no immediate charge
    const checkoutOk =
      session.payment_status === "paid" ||
      (session.mode === "subscription" &&
        session.payment_status === "no_payment_required");
    const isPaid = session.status === "complete" && checkoutOk;

    return new Response(
      JSON.stringify({ 
        paid: isPaid,
        payment_status: session.payment_status,
        status: session.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unhandled error in verify-checkout-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
