import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { postStripePurchaseToRevenueCat } from "../_shared/postStripeToRevenueCat.ts";
import { attachAppUserIdToStripeSubscription } from "../_shared/stripeSubscriptionMetadata.ts";

function stripeUnixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const date = new Date(value * 1000);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function getStripeSubscriptionPeriodEndIso(subscription: any): string | null {
  const itemPeriodEnd = subscription?.items?.data?.[0]?.current_period_end;
  const topLevelPeriodEnd = subscription?.current_period_end;
  return stripeUnixToIso(itemPeriodEnd) ?? stripeUnixToIso(topLevelPeriodEnd);
}

function getStripeSubscriptionBillingPeriod(subscription: any): "monthly" | "annual" | "weekly" {
  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "year") return "annual";
  if (interval === "week") return "weekly";
  return "monthly";
}

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

// Allowed origins for CORS
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
  
  if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
    return normalizedOrigin;
  }
  
  return '*';
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS preflight request - MUST return immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Not configured');
    }

    // Retrieve Checkout Session from Stripe
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Failed to retrieve checkout session:', errorText);
      throw new Error('Failed to retrieve checkout session');
    }

    const session = await sessionResponse.json();

    // Paid checkout, or subscription with trial / no immediate charge
    const paymentOk =
      session.payment_status === 'paid' ||
      (session.mode === 'subscription' &&
        session.payment_status === 'no_payment_required');
    if (!paymentOk) {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Security check: verify the session belongs to the authenticated user
    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      console.error(`Session user_id (${sessionUserId}) does not match authenticated user (${user.id})`);
      throw new Error('Checkout session does not belong to authenticated user');
    }

    // Get tier from session metadata (set during checkout creation)
    const tier = session.metadata?.tier;
    if (!tier || !['basic', 'plus', 'premium'].includes(tier)) {
      console.error('Invalid or missing tier in session metadata:', tier);
      throw new Error('Invalid tier in checkout session');
    }

    // Get customer ID from session
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer?.id;

    if (!customerId) {
      throw new Error('No customer ID in checkout session');
    }

    const metaBilling = session.metadata?.billing;
    const billingFromMetadata =
      metaBilling === 'annual' || metaBilling === 'monthly' || metaBilling === 'weekly'
        ? metaBilling
        : null;

    const { data: existingPlan, error: existingPlanError } = await supabase
      .from('user_plans')
      .select('first_payment_source')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPlanError) {
      console.warn("[confirm-subscription] existing user_plans lookup failed:", existingPlanError);
    }

    // user_plans upsert — column names match public.user_plans
    const planData: Record<string, unknown> = {
      user_id: user.id,
      tier: tier,
      stripe_customer_id: customerId,
      stripe_customer_id_official: customerId,
      last_payment_source: 'stripe',
      status: 'active',
      had_trial: false,
      on_trial: false,
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!existingPlan?.first_payment_source) {
      planData.first_payment_source = 'stripe';
    }

    // Handle subscription vs one-time payment
    if (session.mode === 'subscription') {
      // Subscription mode: get subscription ID and details
      const subscriptionIdFromSession = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

      if (!subscriptionIdFromSession) {
        throw new Error('No subscription ID in checkout session');
      }

      // Get subscription details to get period end
      const subscriptionResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscriptionIdFromSession}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Failed to retrieve subscription:', errorText);
        throw new Error('Failed to retrieve subscription');
      }

      const subscription = await subscriptionResponse.json();

      planData.stripe_subscription_id = subscriptionIdFromSession;
      const currentPeriodEndIso = getStripeSubscriptionPeriodEndIso(subscription);

      if (!currentPeriodEndIso) {
        console.error("[confirm-subscription] Missing subscription period end", {
          checkoutSessionId: sessionId,
          subscriptionId: subscriptionIdFromSession,
          subscriptionStatus: subscription.status ?? null,
          topLevelCurrentPeriodEnd: subscription.current_period_end ?? null,
          itemCurrentPeriodEnd: subscription.items?.data?.[0]?.current_period_end ?? null,
          itemCurrentPeriodStart: subscription.items?.data?.[0]?.current_period_start ?? null,
          itemCount: Array.isArray(subscription.items?.data) ? subscription.items.data.length : null,
        });

        return new Response(
          JSON.stringify({
            error: "missing_subscription_period_end",
            subscription_id: subscriptionIdFromSession,
            subscription_status: subscription.status ?? null,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      planData.current_period_end = currentPeriodEndIso;
      planData.status =
        subscription.status === 'active'
          ? 'active'
          : subscription.status === 'past_due'
            ? 'past_due'
            : subscription.status === 'canceled'
              ? 'canceled'
              : subscription.status === 'trialing'
                ? 'trialing'
                : 'active';

      planData.billing_period = billingFromMetadata ?? getStripeSubscriptionBillingPeriod(subscription);

      const nowSec = Date.now() / 1000;
      const trialEnd = subscription.trial_end as number | undefined;
      const trialStart = subscription.trial_start as number | undefined;
      planData.on_trial =
        subscription.status === 'trialing' ||
        (typeof trialEnd === 'number' && trialEnd > nowSec);
      planData.had_trial =
        typeof trialStart === 'number' && trialStart > 0;
    } else {
      // Payment mode: one-time payment (annual)
      planData.billing_period = billingFromMetadata ?? 'annual';
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      planData.current_period_end = periodEnd.toISOString();
    }

    // Update user_plans table (single source of truth for tiers)
    const { error: planError } = await supabase
      .from('user_plans')
      .upsert(planData, {
        onConflict: 'user_id',
      });

    if (planError) {
      console.error('Database error updating user_plans:', planError);
      throw new Error(`Failed to save subscription: ${planError.message}`);
    }

    const rcFetchToken =
      session.mode === "subscription" && planData.stripe_subscription_id
        ? String(planData.stripe_subscription_id)
        : String(sessionId);
    if (session.mode === "subscription" && planData.stripe_subscription_id) {
      await attachAppUserIdToStripeSubscription(
        stripeSecretKey,
        String(planData.stripe_subscription_id),
        user.id,
      );
    }
    await postStripePurchaseToRevenueCat(user.id, rcFetchToken);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in confirm-subscription:', error);
    // Always return CORS headers, even on error
    const errorOrigin = req.headers.get('origin') || req.headers.get('referer') || '*';
    const errorCorsHeaders = getCorsHeaders(errorOrigin);
    
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...errorCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

