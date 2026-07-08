import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GUIDE_PRODUCT_SLUG, GUIDE_PRODUCT_TITLE, corsHeaders } from "../_shared/digitalGuide.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return json({ error: "Server not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    const requestOrigin =
      req.headers.get("origin") ||
      Deno.env.get("DIGITAL_SITE_ORIGIN") ||
      "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");

    const successUrl = `${baseUrl}/palette-plotting-guide?purchase=success`;
    const cancelUrl = `${baseUrl}/palette-plotting-guide?purchase=cancelled`;

    const formParts: string[] = [];
    formParts.push(`mode=${enc("payment")}`);
    formParts.push(`success_url=${enc(successUrl)}`);
    formParts.push(`cancel_url=${enc(cancelUrl)}`);
    formParts.push(`allow_promotion_codes=true`);
    formParts.push(`metadata[product]=${enc(GUIDE_PRODUCT_SLUG)}`);
    formParts.push(`payment_intent_data[metadata][product]=${enc(GUIDE_PRODUCT_SLUG)}`);

    if (email) {
      formParts.push(`customer_email=${enc(email)}`);
    } else {
      // Ask Stripe to collect the email so the webhook can grant the entitlement.
      formParts.push(`customer_creation=${enc("always")}`);
    }

    const priceId = (Deno.env.get("P_STRIPE_PRICE_GUIDE") || "").trim();
    if (priceId.startsWith("price_")) {
      formParts.push(`line_items[0][price]=${enc(priceId)}`);
      formParts.push(`line_items[0][quantity]=${enc("1")}`);
    } else {
      // Fallback: inline price so the guide can sell without a preconfigured Stripe Price.
      const amount = (Deno.env.get("P_STRIPE_GUIDE_AMOUNT") || "1499").trim();
      formParts.push(`line_items[0][price_data][currency]=${enc("usd")}`);
      formParts.push(`line_items[0][price_data][product_data][name]=${enc(GUIDE_PRODUCT_TITLE)}`);
      formParts.push(`line_items[0][price_data][unit_amount]=${enc(amount)}`);
      formParts.push(`line_items[0][quantity]=${enc("1")}`);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParts.join("&"),
    });

    if (!stripeRes.ok) {
      const errorText = await stripeRes.text();
      console.error("Stripe guide checkout error:", errorText);
      return json({ error: "Failed to create checkout session" }, 500);
    }

    const session = await stripeRes.json();
    return json({ url: session.url });
  } catch (e) {
    console.error("create-guide-checkout error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
