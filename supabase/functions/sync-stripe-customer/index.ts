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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
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
      throw new Error('Not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    // Method 1: Search Stripe by email
    if (user.email) {
      try {
        const customersResponse = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (customersResponse.ok) {
          const customers = await customersResponse.json();
          // Find customer that matches this user (check metadata or find most recent)
          if (customers.data && customers.data.length > 0) {
            // Try to find one with matching user_id in metadata
            const matchingCustomer = customers.data.find((c: any) => 
              c.metadata?.user_id === user.id
            );
            
            if (matchingCustomer) {
              customerId = matchingCustomer.id;
            } else {
              // Use the most recent customer with this email
              customerId = customers.data[0].id;
            }
          }
        }
      } catch (err) {
        console.error('Error searching customers by email:', err);
      }
    }

    // Method 2: If we found a customer, get their subscriptions
    if (customerId) {
      try {
        const subscriptionsResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=all`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (subscriptionsResponse.ok) {
          const subscriptions = await subscriptionsResponse.json();
          if (subscriptions.data && subscriptions.data.length > 0) {
            subscriptionId = subscriptions.data[0].id;
          }
        }
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      }
    }

    // Method 3: Search by user_id in customer metadata (if customer was created with metadata)
    if (!customerId) {
      try {
        // List all customers and search metadata (this is less efficient but works)
        const allCustomersResponse = await fetch(
          `https://api.stripe.com/v1/customers?limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (allCustomersResponse.ok) {
          const allCustomers = await allCustomersResponse.json();
          const matchingCustomer = allCustomers.data?.find((c: any) => 
            c.metadata?.user_id === user.id
          );
          
          if (matchingCustomer) {
            customerId = matchingCustomer.id;
            
            // Get subscriptions for this customer
            const subscriptionsResponse = await fetch(
              `https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=all`,
              {
                headers: {
                  'Authorization': `Bearer ${stripeSecretKey}`,
                },
              }
            );

            if (subscriptionsResponse.ok) {
              const subscriptions = await subscriptionsResponse.json();
              if (subscriptions.data && subscriptions.data.length > 0) {
                subscriptionId = subscriptions.data[0].id;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error searching customers by metadata:', err);
      }
    }

    if (!customerId) {
      throw new Error('No Stripe customer found for this user. Please subscribe first.');
    }

    // Update user_plans with the found customer_id and subscription_id
    const { error: updateError } = await supabase
      .from('user_plans')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        last_payment_source: 'stripe',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error updating user_plans:', updateError);
      throw new Error('Failed to sync customer data to database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        customer_id: customerId,
        subscription_id: subscriptionId,
        message: 'Customer data synced successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in sync-stripe-customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
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

















