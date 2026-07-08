import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-authoritative pricing (cents). Never trust client-sent prices.
const SIZE_PRICE_CENTS: Record<string, number> = {
  "12x24": 9999,
  "18x24": 13999,
  "24x36": 19999,
};

const SIZE_LABEL: Record<string, string> = {
  "12x24": "12×24",
  "18x24": "18×24",
  "24x36": "24×36",
};

const STANDOFFS = new Set(["silver", "gold"]);

const COLOR_LABEL: Record<string, string> = {
  rose_gold: "Rose Gold",
  neon_pink: "Neon Pink",
  light_pink: "Light Pink",
  yellow: "Yellow",
  blue: "Blue",
  sky_blue: "Sky Blue",
  black_opaque: "Black",
  white_opaque: "White",
  clear: "Clear",
  orange: "Orange",
  green: "Green",
  light_green: "Light Green",
  red: "Red",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

type IncomingLine = { size?: string; standoff?: string; color?: string; quantity?: number };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return json({ error: "Server not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const rawLines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (rawLines.length === 0) return json({ error: "Your cart is empty." }, 400);

    // Validate + normalize lines against the server catalog.
    const lines: Array<{
      size: string;
      standoff: string;
      color: string;
      quantity: number;
      unit_amount: number;
      title: string;
    }> = [];
    let amountSubtotal = 0;

    for (const line of rawLines) {
      const size = String(line.size ?? "");
      const standoff = String(line.standoff ?? "");
      const color = String(line.color ?? "");
      const quantity = Math.min(10, Math.max(1, Math.floor(Number(line.quantity) || 0)));

      if (!SIZE_PRICE_CENTS[size] || !STANDOFFS.has(standoff) || !COLOR_LABEL[color] || quantity < 1) {
        return json({ error: "One of the items in your cart is invalid. Refresh and try again." }, 400);
      }

      const unit_amount = SIZE_PRICE_CENTS[size];
      const title = `Acrylic Wall Board — ${COLOR_LABEL[color]} · ${SIZE_LABEL[size]} · ${standoff.charAt(0).toUpperCase() + standoff.slice(1)} standoffs`;
      lines.push({ size, standoff, color, quantity, unit_amount, title });
      amountSubtotal += unit_amount * quantity;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Persist a pending order first so the webhook can reconcile by id.
    const { data: order, error: orderErr } = await supabase
      .from("board_orders")
      .insert({
        status: "pending",
        email: email || null,
        currency: "usd",
        amount_subtotal: amountSubtotal,
        lines,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Failed to create board order:", orderErr);
      return json({ error: "Could not start checkout. Please try again." }, 500);
    }

    const requestOrigin =
      req.headers.get("origin") || Deno.env.get("DIGITAL_SITE_ORIGIN") || "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");
    const successUrl = `${baseUrl}/cart?order=success`;
    const cancelUrl = `${baseUrl}/cart?order=cancelled`;

    const formParts: string[] = [];
    formParts.push(`mode=${enc("payment")}`);
    formParts.push(`success_url=${enc(successUrl)}`);
    formParts.push(`cancel_url=${enc(cancelUrl)}`);
    formParts.push(`allow_promotion_codes=true`);
    formParts.push(`shipping_address_collection[allowed_countries][0]=${enc("US")}`);
    formParts.push(`phone_number_collection[enabled]=true`);
    formParts.push(`client_reference_id=${enc(order.id)}`);
    formParts.push(`metadata[product]=${enc("board-order")}`);
    formParts.push(`metadata[order_id]=${enc(order.id)}`);
    formParts.push(`payment_intent_data[metadata][product]=${enc("board-order")}`);
    formParts.push(`payment_intent_data[metadata][order_id]=${enc(order.id)}`);
    if (email) formParts.push(`customer_email=${enc(email)}`);
    else formParts.push(`customer_creation=${enc("always")}`);

    lines.forEach((line, i) => {
      formParts.push(`line_items[${i}][price_data][currency]=${enc("usd")}`);
      formParts.push(`line_items[${i}][price_data][product_data][name]=${enc(line.title)}`);
      formParts.push(`line_items[${i}][price_data][unit_amount]=${enc(String(line.unit_amount))}`);
      formParts.push(`line_items[${i}][quantity]=${enc(String(line.quantity))}`);
    });

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
      console.error("Stripe board checkout error:", errorText);
      return json({ error: "Failed to create checkout session" }, 500);
    }

    const session = await stripeRes.json();

    await supabase
      .from("board_orders")
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return json({ url: session.url });
  } catch (e) {
    console.error("create-board-checkout error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
