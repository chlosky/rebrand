import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Get Price IDs: premium only (Basic and Plus columns removed)
    const priceIds = {
      monthly: Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") || "price_1T7iz4JIPqOk4csD742fcYv3",
      annual: Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL") || "price_1T7izIJIPqOk4csDOtzyaEBW",
      weekly: Deno.env.get("STRIPE_PRICE_PREMIUM_WEEKLY") || "",
    };

    const fetchPrice = async (priceId: string) => {
      if (!priceId) return null;
      const response = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });
      if (!response.ok) {
        console.error(`Failed to fetch price ${priceId}:`, response.status);
        return null;
      }
      return await response.json();
    };

    const [premiumMonthly, premiumAnnual, premiumWeekly] = await Promise.all([
      fetchPrice(priceIds.monthly),
      fetchPrice(priceIds.annual),
      priceIds.weekly ? fetchPrice(priceIds.weekly) : Promise.resolve(null),
    ]);

    const pricingData = [
      {
        tier: "premium",
        monthly_display_price: premiumMonthly?.unit_amount ? premiumMonthly.unit_amount / 100 : 0,
        annual_display_price: premiumAnnual?.unit_amount ? premiumAnnual.unit_amount / 100 : 0,
        weekly_display_price:
          premiumWeekly?.unit_amount != null ? premiumWeekly.unit_amount / 100 : null,
      },
    ];

    return new Response(JSON.stringify(pricingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching pricing from Stripe:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch pricing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
