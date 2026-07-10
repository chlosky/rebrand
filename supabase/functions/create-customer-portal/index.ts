import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// Get allowed origin for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
    return '*';
  }
  
  const allowedOrigins = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:8080',
    'https://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
  ];
  
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  // For production, you might want to check against your actual domain
  // For now, allow all in development
  return '*';
};

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function resolvePortalReturnUrl(req: Request, bodyReturnUrl?: unknown): string {
  const candidates: string[] = [];

  if (typeof bodyReturnUrl === "string" && bodyReturnUrl.trim()) {
    candidates.push(bodyReturnUrl.trim());
  }

  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        candidates.push(`${url.protocol}//${url.host}/dashboard/settings`);
      }
    } catch {
      // ignore invalid origin
    }
  }

  const siteUrl = (
    Deno.env.get("SITE_URL") ||
    Deno.env.get("APP_URL") ||
    Deno.env.get("VITE_APP_URL") ||
    "https://paletteplotting.com"
  ).replace(/\/$/, "");
  candidates.push(`${siteUrl}/dashboard/settings`);

  for (const candidate of candidates) {
    if (isHttpUrl(candidate)) return candidate;
  }

  return "https://paletteplotting.com/dashboard/settings";
}

async function findStripeCustomerId(
  stripeSecretKey: string,
  user: { id: string; email?: string | null },
): Promise<string | null> {
  if (user.email) {
    try {
      const customersResponse = await fetch(
        `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
        },
      );

      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        const rows = customers.data ?? [];
        const byMetadata = rows.find((c: { metadata?: { user_id?: string } }) =>
          c.metadata?.user_id === user.id
        );
        if (byMetadata?.id) return byMetadata.id;
        if (rows[0]?.id) return rows[0].id;
      }
    } catch (err) {
      console.error("Error searching Stripe customers by email:", err);
    }
  }

  return null;
}

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ url: null, error: "not_configured" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ url: null, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ url: null, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let bodyReturnUrl: unknown = undefined;
    try {
      const body = await req.json();
      bodyReturnUrl = body?.returnUrl;
    } catch {
      // empty body is fine
    }

    // Get user's Stripe customer ID from user_plans first
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = userPlan?.stripe_customer_id?.trim() || null;
    let subscriptionId = userPlan?.stripe_subscription_id?.trim() || null;

    if (!customerId || !subscriptionId) {
      const { data: obSession } = await supabase
        .from('onboarding_sessions')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (!customerId && typeof obSession?.stripe_customer_id === 'string') {
        customerId = obSession.stripe_customer_id.trim() || null;
      }
      if (!subscriptionId && typeof obSession?.stripe_subscription_id === 'string') {
        subscriptionId = obSession.stripe_subscription_id.trim() || null;
      }
    }

    // If no customer_id but we have a subscription_id, fetch customer from Stripe
    if (!customerId && subscriptionId) {
      try {
        const subscriptionResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer?.id;
          
          // Update user_plans with the customer_id we found
          if (customerId && userPlan) {
            await supabase
              .from('user_plans')
              .update({ stripe_customer_id: customerId, last_payment_source: 'stripe' })
              .eq('user_id', user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    }

    // Last resort: Try to find customer by email / metadata in Stripe
    if (!customerId) {
      customerId = await findStripeCustomerId(stripeSecretKey, user);
      if (customerId) {
        await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            last_payment_source: 'stripe',
          }, {
            onConflict: 'user_id'
          });
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({
          url: null,
          error: "no_customer",
          message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify customer exists in Stripe before creating portal session
    try {
      const customerCheckResponse = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!customerCheckResponse.ok) {
        console.warn(`Customer ${customerId} not found in Stripe, searching by email...`);
        const resolved = await findStripeCustomerId(stripeSecretKey, user);
        if (!resolved) {
          return new Response(
            JSON.stringify({
              url: null,
              error: "no_customer",
              message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        customerId = resolved;
        await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            last_payment_source: 'stripe',
          }, {
            onConflict: 'user_id'
          });
      }
    } catch (err) {
      console.error('Error verifying customer:', err);
      return new Response(
        JSON.stringify({
          url: null,
          error: "no_customer",
          message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const returnUrl = resolvePortalReturnUrl(req, bodyReturnUrl);

    // Create Customer Portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      console.error('Stripe Customer Portal creation error:', errorText);
      return new Response(
        JSON.stringify({
          url: null,
          error: "portal_failed",
          message: "Could not open the billing portal. Check that Stripe Customer Portal is enabled in your Stripe dashboard.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const portal = await portalResponse.json();

    return new Response(
      JSON.stringify({ 
        url: portal.url,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-customer-portal:', error);
    return new Response(
      JSON.stringify({
        url: null,
        error: "portal_failed",
        message: sanitizeErrorMessage(error),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});












