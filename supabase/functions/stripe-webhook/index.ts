import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { postStripePurchaseToRevenueCat } from "../_shared/postStripeToRevenueCat.ts";
import { attachAppUserIdToStripeSubscription } from "../_shared/stripeSubscriptionMetadata.ts";
import { GUIDE_PRODUCT_SLUG, grantGuideEntitlement } from "../_shared/digitalGuide.ts";

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Log incoming request for debugging
  console.log('Webhook request received:', {
    method: req.method,
    url: req.url,
    hasStripeSignature: !!req.headers.get('stripe-signature'),
    hasAuthorization: !!req.headers.get('authorization'),
    hasApikey: !!req.headers.get('apikey'),
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the raw body first (needed for signature verification)
    const body = await req.text();
    
    // Get the signature from the request headers
    const signature = req.headers.get('stripe-signature');
    
    // Verify webhook signature when the secret is configured (Stripe's t=/v1= scheme).
    if (webhookSecret) {
      if (!signature) {
        console.warn('STRIPE_WEBHOOK_SECRET configured but no signature in request');
        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let sigTimestamp = '';
      const sigCandidates: string[] = [];
      for (const part of signature.split(',')) {
        const [k, v] = part.trim().split('=');
        if (k === 't') sigTimestamp = v;
        else if (k === 'v1' && v) sigCandidates.push(v);
      }

      const ts = Number(sigTimestamp);
      // Reject stale events (>5 min) to prevent replay.
      const withinTolerance =
        Number.isFinite(ts) && Math.abs(Math.floor(Date.now() / 1000) - ts) <= 300;

      let signatureValid = false;
      if (sigTimestamp && sigCandidates.length > 0 && withinTolerance) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const sigBytes = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(`${sigTimestamp}.${body}`),
        );
        const expected = Array.from(new Uint8Array(sigBytes))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        // Constant-time compare against each provided v1 signature.
        signatureValid = sigCandidates.some((candidate) => {
          if (candidate.length !== expected.length) return false;
          let mismatch = 0;
          for (let i = 0; i < expected.length; i++) {
            mismatch |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
          }
          return mismatch === 0;
        });
      }

      if (!signatureValid) {
        console.warn('Stripe webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification (not recommended for production)');
    }

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse webhook body:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Stripe webhook event received:', event.type, 'ID:', event.id);

    // Handle different event types with error handling to prevent 500 responses
    switch (event.type) {
      case 'checkout.session.completed':
        try {
        await handleCheckoutSessionCompleted(supabase, event.data.object, stripeSecretKey);
        } catch (handlerError) {
          console.error('Error in handleCheckoutSessionCompleted:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        try {
        await handleSubscriptionUpdate(supabase, event.data.object, stripeSecretKey);
        } catch (handlerError) {
          console.error('Error in handleSubscriptionUpdate:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'customer.subscription.deleted':
        try {
        await handleSubscriptionCancellation(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleSubscriptionCancellation:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'invoice.payment_succeeded':
        try {
        await handleInvoicePaymentSucceeded(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleInvoicePaymentSucceeded:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'invoice.payment_failed':
        try {
        await handleInvoicePaymentFailed(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleInvoicePaymentFailed:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Map Stripe Product ID to tier (fallback)
function getTierFromProductId(productId: string): 'basic' | 'plus' | 'premium' | null {
  // Product ID mapping removed - use Price IDs from environment variables instead
  // Price IDs are the preferred method and are environment-driven
  return null;
}

// Map Stripe Price ID to tier
function getTierFromPriceId(priceId: string): 'basic' | 'plus' | 'premium' | null {
  const config = {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
    },
    premium: {
      monthly: Deno.env.get('P_STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('P_STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
  
  // Check all price IDs
  if (priceId === config.basic.monthly || priceId === config.basic.annual) {
    return 'basic';
  }
  if (priceId === config.plus.monthly || priceId === config.plus.annual) {
    return 'plus';
  }
  if (
    priceId === config.premium.monthly ||
    priceId === config.premium.annual ||
    priceId === config.premium.weekly
  ) {
    return 'premium';
  }
  
  return null;
}

function billingPeriodFromStripeSubscription(subscription: {
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
}): 'monthly' | 'annual' | 'weekly' {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval as string | undefined;
  if (interval === 'year') return 'annual';
  if (interval === 'week') return 'weekly';
  return 'monthly';
}

async function handleSubscriptionUpdate(supabase: any, subscription: any, stripeSecretKey: string) {
  let resolvedUserId =
    subscription.metadata?.user_id || subscription.metadata?.app_user_id;
  
  // If no user_id in metadata, try to resolve via onboarding_sessions
  if (!resolvedUserId) {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;
    
    if (customerId) {
      // Lookup onboarding_sessions by stripe_customer_id
      const { data: obSession, error: obErr } = await supabase
        .from('onboarding_sessions')
        .select('id, status, user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      
      if (obErr) {
        console.error('Error looking up onboarding session:', JSON.stringify(obErr, null, 2));
      } else if (obSession) {
        if (!obSession.user_id) {
          // Onboarding session exists but user_id is null - update subscription_id and return
          const { error: updateErr } = await supabase
            .from('onboarding_sessions')
            .update({
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', obSession.id);
          
          if (updateErr) {
            console.error('Error updating onboarding_sessions subscription_id:', JSON.stringify(updateErr, null, 2));
          }
          return; // Don't try to update user_plans since user doesn't exist yet
        } else {
          // Onboarding session has user_id - use it
          resolvedUserId = obSession.user_id;
          console.log('Resolved userId from onboarding_sessions:', resolvedUserId);
        }
      }
    }
    
    if (!resolvedUserId) {
      console.log('No user_id in subscription metadata and no matching onboarding session with user_id - subscription will be handled after account creation');
      return;
    }
  }
  
  const userId = resolvedUserId;

  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  // Get the price ID and product ID from the subscription
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const productId = subscription.items?.data?.[0]?.price?.product;
  
  if (!priceId && !productId) {
    console.error('No price ID or product ID found in subscription');
    return;
  }

  // Try to map Price ID to tier first (preferred method)
  let tier = priceId ? getTierFromPriceId(priceId) : null;
  
  // If Price ID mapping fails, try Product ID as fallback
  if (!tier && productId) {
    tier = getTierFromProductId(productId);
  }
  
  if (!tier) {
    console.error(`Could not map price ID ${priceId} or product ID ${productId} to a tier`);
    return;
  }

  // Get current plan from database to detect changes
  const { data: currentPlan } = await supabase
    .from('user_plans')
    .select('tier, status')
    .eq('user_id', userId)
    .maybeSingle();

  const oldTier = currentPlan?.tier;
  const oldStatus = currentPlan?.status;
  const tierChanged = oldTier && oldTier !== tier;
  
  // Determine new status
  const isTrialing = subscription.status === 'trialing';
  const newStatus = isTrialing ? 'trialing' :
                    subscription.status === 'active' ? 'active' : 
                    subscription.status === 'past_due' ? 'past_due' :
                    subscription.status === 'canceled' ? 'canceled' : 'active';
  
  // Detect resubscription: status changed from canceled to active
  const isResubscription = oldStatus === 'canceled' && newStatus === 'active';

  const billingPeriod = billingPeriodFromStripeSubscription(subscription);
  const nowSec = Date.now() / 1000;
  const trialEnd = subscription.trial_end as number | undefined;
  const trialStart = subscription.trial_start as number | undefined;
  const onTrial = isTrialing || (typeof trialEnd === 'number' && trialEnd > nowSec);
  const hadTrial = typeof trialStart === 'number' && trialStart > 0;

  // Update user_plans table (single source of truth for tiers)
  const { error: planError } = await supabase
    .from('user_plans')
    .upsert({
      user_id: userId,
      tier: tier,
      billing_period: billingPeriod,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      last_payment_source: 'stripe',
      status: newStatus,
      on_trial: onTrial,
      ...(hadTrial ? { had_trial: true } : {}),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (planError) {
    console.error('Error updating user_plans:', planError);
    console.error('Full error details:', JSON.stringify(planError, null, 2));
    // Don't throw - log and return to prevent webhook failure
    return;
  }

  if (newStatus === 'canceled' || newStatus === 'past_due') {
    const { error: cancelRemErr } = await supabase
      .from('board_reminders')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'scheduled');
    if (cancelRemErr) {
      console.warn('board_reminders cancel on plan status change:', cancelRemErr);
    }
  }

  await attachAppUserIdToStripeSubscription(stripeSecretKey, subscription.id, userId);
  await postStripePurchaseToRevenueCat(userId, subscription.id);

  // Send welcome-back email if resubscribing
  if (isResubscription) {
    try {
      // Get user email and profile info
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.user?.email) {
        console.warn('User not found or no email for welcome-back notification');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, username')
          .eq('id', userId)
          .single();

        const userName = profile?.first_name || profile?.username || 'there';
        const userEmail = user.user.email;

        // Get site URL for links
        const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
        const appUrl = siteUrl;
        const privacyPolicyUrl = `${siteUrl}/privacy`;

        // Send welcome-back email via Postmark
        const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
        const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

        if (!POSTMARK_SERVER_TOKEN) {
          console.warn('POSTMARK_SERVER_TOKEN not configured, skipping welcome-back email');
        } else {
          const templateModel = {
            name: userName,
            app_url: appUrl,
            privacy_policy_url: privacyPolicyUrl,
            tiktok_url: 'https://www.tiktok.com/@paletteplotting',
            youtube_url: 'https://www.youtube.com/@paletteplotting',
            instagram_url: 'https://www.instagram.com/paletteplotting',
          };

          const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
            },
            body: JSON.stringify({
              To: userEmail,
              TemplateAlias: 'welcome-back',
              TemplateModel: templateModel,
              MessageStream: 'outbound',
              Tag: 'welcome-back',
              Metadata: { 
                email_type: 'welcome_back',
                user_id: userId,
              },
              From: POSTMARK_FROM_EMAIL || undefined,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send welcome-back email:', errorText);
          } else {
            const emailData = await emailResponse.json().catch(() => ({}));
            console.log('Welcome-back email sent successfully:', emailData);
          }
        }
      }
    } catch (emailError) {
      console.warn('Error sending welcome-back email (non-fatal):', emailError);
      // Don't throw - email failure shouldn't break webhook
    }
  }

  // Send subscription change email if tier changed
  if (tierChanged && oldTier) {
    try {
      // Get user email and profile info
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.user?.email) {
        console.warn('User not found or no email for subscription change notification');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, username')
        .eq('id', userId)
        .single();

      const userName = profile?.first_name || profile?.username || 'there';
      const userEmail = user.user.email;

      // Map tiers to plan names
      const planNames: Record<string, string> = {
        basic: 'Basic',
        plus: 'Plus',
        premium: 'Premium',
      };
      const oldPlanName = planNames[oldTier] || oldTier;
      const newPlanName = planNames[tier] || tier;

      // Determine if upgrade or downgrade
      const tierOrder: Record<string, number> = { basic: 1, plus: 2, premium: 3 };
      const isUpgrade = (tierOrder[tier] || 0) > (tierOrder[oldTier] || 0);
      const subscriptionMessage = isUpgrade
        ? `You've upgraded from ${oldPlanName} to ${newPlanName}. You now have access to all ${newPlanName} features.`
        : `You've changed from ${oldPlanName} to ${newPlanName}. Your plan features have been updated accordingly.`;

      // Calculate effective date (usually current period start or end)
      const effectiveDate = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'immediately';

      // Get site URL for links
      const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
      const billingUrl = `${siteUrl}/settings`;
      const privacyPolicyUrl = `${siteUrl}/privacy`;

      // Send subscription change email via Postmark
      const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
      const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

      if (!POSTMARK_SERVER_TOKEN) {
        console.warn('POSTMARK_SERVER_TOKEN not configured, skipping subscription change email');
        return;
      }

      const templateModel = {
        name: userName,
        new_plan_name: newPlanName,
        effective_date: effectiveDate,
        subscription_message: subscriptionMessage,
        billing_url: billingUrl,
        privacy_policy_url: privacyPolicyUrl,
        tiktok_url: 'https://www.tiktok.com/@paletteplotting',
        youtube_url: 'https://www.youtube.com/@paletteplotting',
        instagram_url: 'https://www.instagram.com/paletteplotting',
      };

      const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
        },
        body: JSON.stringify({
          To: userEmail,
          TemplateAlias: 'subscription-change',
          TemplateModel: templateModel,
          MessageStream: 'outbound',
          Tag: 'subscription-change',
          Metadata: { 
            email_type: 'subscription_change',
            old_tier: oldTier,
            new_tier: tier,
            is_upgrade: isUpgrade.toString(),
          },
          From: POSTMARK_FROM_EMAIL || undefined,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Failed to send subscription change email:', errorText);
      } else {
        const emailData = await emailResponse.json().catch(() => ({}));
        console.log('Subscription change email sent successfully:', emailData);
      }
    } catch (emailError) {
      console.warn('Error sending subscription change email (non-fatal):', emailError);
      // Don't throw - email failure shouldn't break webhook
    }
  }
}

async function handleSubscriptionCancellation(supabase: any, subscription: any) {
  const userId = subscription.metadata?.user_id;
  let finalUserId = userId;
  
  if (!userId) {
    const { data: planRow } = await supabase
      .from('user_plans')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!planRow?.user_id) {
      console.error('No user_id found for subscription cancellation');
      return;
    }

    finalUserId = planRow.user_id;
  }

  // Update user_plans (single source of truth)
    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        status: 'canceled',
        last_payment_source: 'stripe',
        updated_at: new Date().toISOString(),
      })
    .eq('user_id', finalUserId);

    if (planError) {
      console.error('Error canceling user_plans:', planError);
    } else {
      const { error: cancelRemErr } = await supabase
        .from('board_reminders')
        .update({ status: 'cancelled' })
        .eq('user_id', finalUserId)
        .eq('status', 'scheduled');
      if (cancelRemErr) {
        console.warn('board_reminders cancel on subscription deletion:', cancelRemErr);
      }
    }

  // Send cancellation email
  try {
    // Get user email and profile info
    const { data: user } = await supabase.auth.admin.getUserById(finalUserId);
    if (!user || !user.user?.email) {
      console.warn('User not found or no email for cancellation notification');
    return;
  }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, username')
      .eq('id', finalUserId)
      .single();

    const userName = profile?.first_name || profile?.username || 'there';
    const userEmail = user.user.email;

    // Get expiry date from subscription (current_period_end)
    const expiryDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'the end of your current billing period';

    // Get site URL for reactivate link
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
    const reactivateUrl = `${siteUrl}/resubscribe`;
    const privacyPolicyUrl = `${siteUrl}/privacy`;

    // Send cancellation email via Postmark
    const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
    const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

    if (!POSTMARK_SERVER_TOKEN) {
      console.warn('POSTMARK_SERVER_TOKEN not configured, skipping cancellation email');
      return;
    }

    const templateModel = {
      name: userName,
      expiry_date: expiryDate,
      reactivate_url: reactivateUrl,
      privacy_policy_url: privacyPolicyUrl,
      tiktok_url: 'https://www.tiktok.com/@paletteplotting',
      youtube_url: 'https://www.youtube.com/@paletteplotting',
      instagram_url: 'https://www.instagram.com/paletteplotting',
    };

    const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        To: userEmail,
        TemplateAlias: 'cancellation',
        TemplateModel: templateModel,
        MessageStream: 'outbound',
        Tag: 'cancellation',
        Metadata: { email_type: 'cancellation' },
        From: POSTMARK_FROM_EMAIL || undefined,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Failed to send cancellation email:', errorText);
    } else {
      const emailData = await emailResponse.json().catch(() => ({}));
      console.log('Cancellation email sent successfully:', emailData);
    }
  } catch (emailError) {
    console.warn('Error sending cancellation email (non-fatal):', emailError);
    // Don't throw - email failure shouldn't break webhook
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: any) {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice is not associated with a subscription');
    return;
  }

  const { data: planRow } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!planRow?.user_id) {
    console.error('No user_plans row for subscription', subscriptionId);
    return;
  }

  const updateFields: Record<string, unknown> = {
    last_payment_source: 'stripe',
    current_period_end: new Date(invoice.period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (typeof invoice.amount_paid === 'number' && invoice.amount_paid > 0) {
    updateFields.status = 'active';
    updateFields.on_trial = false;
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .update(updateFields)
    .eq('user_id', planRow.user_id);

  if (planError) {
    console.error('Error updating user_plans after payment:', planError);
  }
}

async function handleInvoicePaymentFailed(supabase: any, invoice: any) {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice is not associated with a subscription');
    return;
  }

  const { data: planRow } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!planRow?.user_id) {
    console.error('No user_plans row for failed payment subscription', subscriptionId);
    return;
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .update({
      status: 'past_due',
      last_payment_source: 'stripe',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', planRow.user_id);

  if (planError) {
    console.error('Error updating user_plans after failed payment:', planError);
  }
}

async function handleCheckoutSessionCompleted(supabase: any, session: any, stripeSecretKey: string) {
  try {
  // One-time digital guide purchase: grant a lifetime entitlement to the buyer's email.
  if (session.metadata?.product === GUIDE_PRODUCT_SLUG) {
    if (session.payment_status !== 'paid') {
      console.log('Skipping guide entitlement - payment not completed:', session.payment_status);
      return;
    }
    const guideEmail = session.customer_details?.email || session.customer_email || null;
    if (!guideEmail) {
      console.error('Guide checkout completed but no email on session', session.id);
      return;
    }
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;
    await grantGuideEntitlement(supabase, {
      email: guideEmail,
      checkoutSessionId: session.id,
      paymentIntentId,
    });
    console.log('GUIDE_ENTITLEMENT_GRANTED', { email: guideEmail, session: session.id });
    return;
  }

  // Physical board order paid through Stripe Checkout.
  if (session.metadata?.product === 'board-order') {
    if (session.payment_status !== 'paid') {
      console.log('Skipping board order - payment not completed:', session.payment_status);
      return;
    }
    const orderId = session.metadata?.order_id || session.client_reference_id;
    if (!orderId) {
      console.error('Board order checkout completed but no order_id on session', session.id);
      return;
    }

    const boardEmail = session.customer_details?.email || session.customer_email || null;
    const shipping = session.shipping_details || session.customer_details || null;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

    const { data: order, error: orderErr } = await supabase
      .from('board_orders')
      .update({
        status: 'paid',
        email: boardEmail,
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : null,
        shipping_name: shipping?.name || null,
        shipping_address: shipping?.address || null,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(orderId))
      .select('id,email,amount_total,currency,lines,shipping_name,shipping_address,guide_granted')
      .single();

    if (orderErr) {
      console.error('BOARD_ORDER_UPDATE_FAILED', { orderId, error: JSON.stringify(orderErr, null, 2) });
      return;
    }
    console.log('BOARD_ORDER_PAID', { orderId });

    // Board purchase includes the digital guide — grant a lifetime entitlement.
    if (boardEmail && !order?.guide_granted) {
      try {
        await grantGuideEntitlement(supabase, {
          email: boardEmail,
          checkoutSessionId: session.id,
          paymentIntentId,
        });
        await supabase
          .from('board_orders')
          .update({ guide_granted: true, updated_at: new Date().toISOString() })
          .eq('id', String(orderId));
      } catch (grantErr) {
        console.warn('Board order guide grant failed (non-fatal):', grantErr);
      }
    }

    // Notify fulfillment by email (best-effort).
    try {
      const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
      const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');
      const notifyTo = Deno.env.get('ORDER_NOTIFY_EMAIL') || POSTMARK_FROM_EMAIL;
      if (POSTMARK_SERVER_TOKEN && POSTMARK_FROM_EMAIL && notifyTo) {
        const lines = Array.isArray(order?.lines) ? order.lines : [];
        const itemsText = lines
          .map((l: any) => `- ${l.title} × ${l.quantity} ($${((l.unit_amount * l.quantity) / 100).toFixed(2)})`)
          .join('\n');
        const addr = order?.shipping_address || {};
        const shipText = [
          order?.shipping_name || '',
          addr.line1 || '',
          addr.line2 || '',
          [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
          addr.country || '',
        ].filter(Boolean).join('\n');
        const total = typeof order?.amount_total === 'number' ? `$${(order.amount_total / 100).toFixed(2)}` : 'n/a';

        const emailRes = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
          },
          body: JSON.stringify({
            From: POSTMARK_FROM_EMAIL,
            To: notifyTo,
            Subject: `New board order — ${total} (${orderId})`,
            TextBody:
              `New paid board order.\n\nOrder: ${orderId}\nEmail: ${boardEmail}\nTotal: ${total}\n\nItems:\n${itemsText}\n\nShip to:\n${shipText}\n`,
            MessageStream: 'outbound',
            Tag: 'board-order',
          }),
        });
        if (!emailRes.ok) {
          console.error('Board order notify email failed:', await emailRes.text());
        }
      } else {
        console.warn('Postmark not fully configured, skipping board order notify email');
      }
    } catch (emailErr) {
      console.warn('Board order notify email exception (non-fatal):', emailErr);
    }

    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    // New flow: payment-first onboarding (no auth user yet).
    // Step 1: Only proceed if checkout completed (paid or subscription trial)
    const checkoutOk =
      session.payment_status === "paid" ||
      (session.mode === "subscription" &&
        session.payment_status === "no_payment_required");
    if (!checkoutOk) {
      console.log('Skipping checkout.session.completed - checkout not completed:', session.payment_status);
      return;
    }

    // Attach Stripe result to onboarding_sessions using client_reference_id / metadata.
    const onboardingSessionId = session.metadata?.onboarding_session_id || session.client_reference_id;
    if (!onboardingSessionId) {
      console.error('No user_id and no onboarding_session_id/client_reference_id on checkout.session.completed', {
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
        session_id: session.id
      });
      return;
    }

    console.log('Processing checkout.session.completed for onboarding session:', onboardingSessionId);

      // Validate UUID format (case-insensitive, allows any hex characters)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const sessionIdStr = String(onboardingSessionId).trim();
      if (!uuidRegex.test(sessionIdStr)) {
        console.error('Invalid onboarding session ID format (not a UUID):', onboardingSessionId);
        return;
      }

    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email ||
      null;

    const tier = session.metadata?.tier || null;
    const billing = session.metadata?.billing || null;

    // Step 1: Mark onboarding session as paid (webhook is source of truth)
    const updateData = {
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      stripe_customer_email: customerEmail,
      stripe_subscription_id: subscriptionId,
      selected_tier: tier,
      billing: billing,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSession, error: obErr } = await supabase
      .from('onboarding_sessions')
      .update(updateData)
      .eq('id', onboardingSessionId)
      .select('id,status,email,first_name,username,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at')
      .single();

    if (obErr) {
      console.error('STEP1_PAID_UPDATE_FAILED', {
        onboardingSessionId,
        error: JSON.stringify(obErr, null, 2),
        updateData: JSON.stringify(updateData, null, 2)
      });
      return;
    }
    console.log('STEP1_PAID_UPDATE_OK', { onboardingSessionId, status: updatedSession?.status });

    // Step 2: Create the auth user (always, because this is payment-first)
    if (!updatedSession.user_id && updatedSession.email) {
      let finalUserId: string | null = null;
      
      // Generate secure temporary password
      const tempPasswordBytes = new Uint8Array(32);
      crypto.getRandomValues(tempPasswordBytes);
      const tempPassword = Array.from(tempPasswordBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('') + 'A1!'; // Add uppercase, digit, special char to meet requirements
      
      // Attempt to create account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: updatedSession.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: updatedSession.first_name || null,
          username: updatedSession.username || null,
        },
      });

      if (createError) {
        // If user already exists, try to resolve by email
        if (createError.message?.includes('already exists') || createError.message?.includes('already registered')) {
          // Try getUserByEmail if available (Supabase admin API)
          try {
            // Use listUsers with filter if getUserByEmail not available
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
              console.error('STEP2_AUTH_FAILED', {
                onboardingSessionId,
                reason: 'listUsers failed',
                error: JSON.stringify(listError, null, 2)
              });
              return;
            }
            const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === updatedSession.email.toLowerCase());
            if (existingUser) {
              finalUserId = existingUser.id;
            } else {
              console.error('STEP2_AUTH_FAILED', {
                onboardingSessionId,
                reason: 'user exists but not found in list'
              });
              return;
            }
          } catch (lookupErr) {
            console.error('STEP2_AUTH_FAILED', {
              onboardingSessionId,
              reason: 'lookup exception',
              error: String(lookupErr)
            });
            return;
          }
        } else {
          console.error('STEP2_AUTH_FAILED', {
            onboardingSessionId,
            reason: 'createUser error',
            error: JSON.stringify(createError, null, 2)
          });
          return;
        }
      } else if (newUser?.user) {
        finalUserId = newUser.user.id;
      } else {
        console.error('STEP2_AUTH_FAILED', {
          onboardingSessionId,
          reason: 'no user returned from createUser'
        });
        return;
      }

      if (!finalUserId) {
        console.error('STEP2_AUTH_FAILED', {
          onboardingSessionId,
          reason: 'finalUserId is null'
        });
        return;
      }

      console.log('STEP2_AUTH_OK', { onboardingSessionId, finalUserId });

      // Step 3: Attach onboarding session → auth + persist onboarding data
      // 3A) Attach + activate onboarding session
      const paidAtIso = updatedSession.paid_at ? new Date(updatedSession.paid_at).toISOString() : new Date().toISOString();
      
      // Determine current_period_end
      let currentPeriodEndIso: string | null = null;
      let subscriptionStatus: string | null = null;
      let subscriptionOnTrial = false;
      let subscriptionHadTrial = false;
      let subscriptionBillingPeriod: "monthly" | "annual" | "weekly" =
        billing === "annual" ? "annual" : billing === "weekly" ? "weekly" : "monthly";

      if (subscriptionId) {
        try {
          const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${stripeSecretKey}` },
          });
          if (subResp.ok) {
            const sub = await subResp.json();
            subscriptionStatus = sub.status || null;
            subscriptionOnTrial = sub.status === "trialing";
            subscriptionHadTrial = typeof sub.trial_start === "number" && sub.trial_start > 0;
            subscriptionBillingPeriod = billingPeriodFromStripeSubscription(sub);
            if (sub.current_period_end) {
              currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
            }
          }
        } catch (err) {
          console.warn('Error fetching subscription for period end (non-fatal):', err);
        }
      } else if (billing === "annual") {
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        currentPeriodEndIso = periodEnd.toISOString();
      }

      // Validate tier
      const finalTier = (updatedSession.selected_tier || tier) as "basic" | "plus" | "premium" | null;
      if (!finalTier || !["basic", "plus", "premium"].includes(finalTier)) {
        console.warn('Missing or invalid tier, defaulting to basic:', finalTier);
      }
      const safeTier = (finalTier && ["basic", "plus", "premium"].includes(finalTier)) ? finalTier : "basic";

      // Attach onboarding session to user
      const { error: attachErr } = await supabase
        .from("onboarding_sessions")
        .update({
          user_id: finalUserId,
          status: "active",
          stripe_checkout_session_id: session.id,
          stripe_customer_id: customerId,
          stripe_customer_email: customerEmail,
          stripe_subscription_id: subscriptionId,
          paid_at: paidAtIso,
          selected_tier: safeTier,
          billing: billing,
        })
        .eq("id", String(onboardingSessionId));

      if (attachErr) {
        console.error("STEP3_ATTACH_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(attachErr, null, 2)
        });
      } else {
        console.log("STEP3_ATTACH_OK", { onboardingSessionId, finalUserId });
      }

      // 3B) Upsert profiles (best-effort)
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          id: finalUserId,
          first_name: updatedSession.first_name || null,
          username: updatedSession.username || null,
          onboarding_answers: updatedSession.onboarding_answers || {},
        },
        { onConflict: "id" },
      );

      if (profileErr) {
        console.error("STEP4_PROFILE_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(profileErr, null, 2)
        });
      } else {
        console.log("STEP4_PROFILE_OK", { onboardingSessionId, finalUserId });
      }

      // 3C) Upsert user_preferences (best-effort)
      const finalEmailConsent = updatedSession.email_consent ?? false;
      const finalSmsConsent = updatedSession.sms_consent ?? false;
      const { error: prefsErr } = await supabase.from("user_preferences").upsert(
        {
          user_id: finalUserId,
          texts_enabled: finalSmsConsent,
          preferred_send_window: "both",
          email_marketing: finalEmailConsent,
        },
        { onConflict: "user_id" },
      );

      if (prefsErr) {
        console.error("STEP5_PREFS_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(prefsErr, null, 2)
        });
      } else {
        console.log("STEP5_PREFS_OK", { onboardingSessionId, finalUserId });
      }

      // 3D) Guarantee user_plans exists (critical)
      const planStatus =
        subscriptionStatus === "trialing"
          ? "trialing"
          : subscriptionStatus === "past_due"
            ? "past_due"
            : subscriptionStatus === "canceled"
              ? "canceled"
              : "active";
      
      // Try upsert first (preferred method)
      let planErr = null;
      const { error: upsertErr } = await supabase.from("user_plans").upsert(
        {
          id: finalUserId, // Set id to user_id to satisfy FK constraint on id column (migration should have removed this, but handle it)
          user_id: finalUserId,
          tier: safeTier,
          billing_period: subscriptionBillingPeriod,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_source: "stripe",
          status: planStatus,
          on_trial: subscriptionOnTrial,
          had_trial: subscriptionHadTrial || subscriptionOnTrial,
          current_period_end: currentPeriodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      
      if (upsertErr && upsertErr.code === "23503" && upsertErr.message?.includes("user_plans_id_fkey")) {
        console.error(
          "STEP6_PLANS_BLOCKED_BY_LEGACY_ID_FK_NO_DELETE_ATTEMPTED",
          JSON.stringify(upsertErr, null, 2),
        );
      }
      planErr = upsertErr;

      if (planErr) {
        console.error("STEP6_PLANS_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(planErr, null, 2)
        });
      } else {
        console.log("STEP6_PLANS_OK", { onboardingSessionId, finalUserId, tier: safeTier, status: planStatus });
        if (subscriptionId) {
          await attachAppUserIdToStripeSubscription(stripeSecretKey, subscriptionId, finalUserId);
        }
        const rcToken = subscriptionId || session.id;
        await postStripePurchaseToRevenueCat(finalUserId, rcToken);
      }

      // Step 7: Send password reset email (must not depend on any upsert success)
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      
      try {
        const resetResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': `${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ email: updatedSession.email }),
        });

        const responseText = await resetResponse.text();
        console.log('STEP7_EMAIL_RESET_ATTEMPTED', {
          onboardingSessionId,
          finalUserId,
          status: resetResponse.status,
          statusText: resetResponse.statusText,
          body: responseText
        });

        if (!resetResponse.ok) {
          console.error('Password reset email failed:', responseText);
        }
      } catch (emailError) {
        console.error('STEP7_EMAIL_RESET_EXCEPTION', {
          onboardingSessionId,
          finalUserId,
          error: String(emailError)
        });
      }

      // Sanity check: Verify user_plans was created
      const { data: planCheck, error: planCheckErr } = await supabase
        .from("user_plans")
        .select("user_id,tier,status,current_period_end")
        .eq("user_id", finalUserId)
        .maybeSingle();

      console.log("PLAN_CHECK", {
        onboardingSessionId,
        finalUserId,
        planCheck,
        planCheckErr: planCheckErr ? JSON.stringify(planCheckErr, null, 2) : null
      });
    } else {
      console.log('❌ Conditions NOT met - skipping account creation', {
        reason: updatedSession?.user_id ? 'user_id already set' : 'email is missing',
        user_id: updatedSession?.user_id,
        email: updatedSession?.email
      });
    }

    return;
  }

    // Old flow: user already exists (has user_id in metadata)
    // userId is already declared above, so we can use it here
    // If we reach this point, userId exists (otherwise we would have returned above)

  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id;

  // Get tier from metadata (set during checkout)
  const tier = session.metadata?.tier || 'basic';
  
  if (!['basic', 'plus', 'premium'].includes(tier)) {
    console.error(`Invalid tier in checkout session: ${tier}`);
    return;
  }

  let periodEnd: Date | null = null;
  let subscriptionId: string | null = null;
  let planStatus = 'active';
  let onTrial = false;
  let hadTrial = false;
  let billingPeriod: 'monthly' | 'annual' | 'weekly' =
    session.metadata?.billing === 'annual'
      ? 'annual'
      : session.metadata?.billing === 'weekly'
        ? 'weekly'
        : 'monthly';

  if (session.mode === 'subscription') {
    subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    if (subscriptionId) {
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
        periodEnd = new Date(subscription.current_period_end * 1000);
        billingPeriod = billingPeriodFromStripeSubscription(subscription);
        onTrial = subscription.status === 'trialing';
        hadTrial = typeof subscription.trial_start === 'number' && subscription.trial_start > 0;
        planStatus =
          subscription.status === 'trialing'
            ? 'trialing'
            : subscription.status === 'past_due'
              ? 'past_due'
              : subscription.status === 'canceled'
                ? 'canceled'
                : 'active';
      }
    }
  } else {
    periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    billingPeriod = 'annual';
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .upsert({
      user_id: userId,
      tier: tier,
      billing_period: billingPeriod,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      last_payment_source: 'stripe',
      status: planStatus,
      on_trial: onTrial,
      had_trial: hadTrial || onTrial,
      current_period_end: periodEnd ? periodEnd.toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (planError) {
    console.error('Error saving user_plans from checkout session:', planError);
      console.error('Full error details:', JSON.stringify(planError, null, 2));
      // Don't throw - log and return to prevent webhook failure
      return;
  }

  {
    if (subscriptionId) {
      await attachAppUserIdToStripeSubscription(stripeSecretKey, subscriptionId, userId);
    }
    const rcToken = subscriptionId || session.id;
    await postStripePurchaseToRevenueCat(userId, rcToken);
  }

  } catch (error) {
    console.error('Unexpected error in handleCheckoutSessionCompleted:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Don't rethrow - let caller handle gracefully
    return;
  }
}



