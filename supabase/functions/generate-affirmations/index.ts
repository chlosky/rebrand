import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  aiLanguageInstruction,
  displayLabelForCanonicalLocalized,
  resolveAppLocale,
  resolveUserAppLocale,
  type AppLocale,
} from "../_shared/aiLocale.ts";
import { SP_SPECIFIC_PERSON_FOR_PROMPTS } from "../_shared/manifestationLexicon.ts";
import {
  DANGEROUS_CONTENT_KEYWORDS,
  PROFANITY_AND_ABUSE_KEYWORDS,
  SELF_HARM_KEYWORDS,
  normalizedIncludesAny,
} from "../_shared/moderationKeywords.ts";
import { resolveWeeklyGoalCategoryFromAiText } from "../_shared/supportCategories.ts";

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

// INLINED FROM: ../_shared/aiUsage.ts
// (Dashboard deployment can't import from _shared folder)

/**
 * Calculate cost for token-based OpenAI calls (Chat, Aff, BR)
 * Returns null costs for unknown models
 */
function calcTokenCost(model: string, inputTokens: number, outputTokens: number) {
  // USD per token
  const PRICING: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
  };

  const p = PRICING[model];
  if (!p) return { inputCost: null, outputCost: null, totalCost: null };

  const inputCost = inputTokens * p.in;
  const outputCost = outputTokens * p.out;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

/**
 * Best-effort insert into ai_usage table
 * Never throws - if logging fails, the main function continues normally
 */
async function safeInsertUsage(
  supabaseAdmin: any,
  row: Record<string, any>
) {
  try {
    await supabaseAdmin.from("ai_usage").insert(row);
  } catch (_e) {
    // fail open: never throw
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, category: categoryRaw, sessionId, resumeToken, locale: bodyLocale } = await req.json() as {
      topic?: string;
      category?: string;
      sessionId?: string;
      resumeToken?: string;
      locale?: string;
    };

    if (!topic) {
      throw new Error('Topic is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    let onboardingSessionId: string | null = null;

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (!userId && sessionId && resumeToken) {
      const resumeTokenHash = await sha256Hex(String(resumeToken));
      const { data: obSession } = await supabase
        .from('onboarding_sessions')
        .select('id, resume_token_hash')
        .eq('id', String(sessionId))
        .maybeSingle();
      if (obSession?.resume_token_hash === resumeTokenHash) {
        onboardingSessionId = obSession.id;
      }
    }

    if (!userId && !onboardingSessionId) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appLocale: AppLocale = userId
      ? await resolveUserAppLocale(supabase, userId, bodyLocale)
      : resolveAppLocale(bodyLocale);

    const categoryCanonical =
      typeof categoryRaw === "string" && categoryRaw.trim()
        ? resolveWeeklyGoalCategoryFromAiText(categoryRaw.trim())
        : null;
    const categoryFocusLine =
      categoryCanonical != null
        ? ` The user's chosen manifestation focus for this set is: ${displayLabelForCanonicalLocalized(categoryCanonical, appLocale)}. Let the wording of all five affirmations clearly support that focus (without naming the app or UI labels unless natural).`
        : "";

    // Check if user is blocked (30+ rejections in last 24 hours) — logged-in users only
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (userId) {
    const { count: recentRejections } = await supabase
      .from('rejection_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'Aff')
      .gte('rejected_at', twentyFourHoursAgo);

    if (recentRejections && recentRejections >= 30) {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return new Response(
        JSON.stringify({ 
          error: "This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours.",
          blocked_until: blockUntil,
          terms_link: "/terms",
          blocked: true
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    }

    const topicForModeration = String(topic ?? "").trim();
    const containsSelfHarm = normalizedIncludesAny(topicForModeration, SELF_HARM_KEYWORDS);
    const containsDangerous = normalizedIncludesAny(topicForModeration, DANGEROUS_CONTENT_KEYWORDS);
    const containsProfanityOrAbuse = normalizedIncludesAny(topicForModeration, PROFANITY_AND_ABUSE_KEYWORDS);

    if (containsSelfHarm || containsDangerous || containsProfanityOrAbuse) {
      if (userId) {
        await supabase.from("rejection_log").insert({
          user_id: userId,
          feature: "Aff",
          reason: containsSelfHarm ? "self_harm_keyword" : "unsafe_keyword",
          input_preview: topicForModeration.slice(0, 500),
        });
      }

      return new Response(
        JSON.stringify({
          error: "This title can't be processed. Please try a different topic.",
          rejected: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const OPENAI_API_KEY = Deno.env.get('Aff');
    if (!OPENAI_API_KEY) {
      throw new Error('Error. Please try again.');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating powerful, positive affirmations for manifestation and personal growth. Generate affirmations that are present-tense, first-person, positive, and emotionally resonant.\n\n${aiLanguageInstruction(appLocale)}\n\n${SP_SPECIFIC_PERSON_FOR_PROMPTS}`
          },
          {
            role: 'user',
            content: `Generate exactly 5 powerful affirmations about "${topic}".${categoryFocusLine} Each affirmation should:
- Be in present tense and first person
- Be positive and empowering
- Be specific and emotionally engaging
- Be between 5-15 words
- Match the language required in the system instructions

Return ONLY the 5 affirmations, one per line, with no numbering, bullets, or extra text.`
          }
        ]
      })
    });
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: 'Payment required.'
        }), {
          status: 402,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Log OpenAI usage (best-effort, never throws)
    const usage = data?.usage ?? {};
    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? (inputTokens + outputTokens);
    const { inputCost, outputCost, totalCost } = calcTokenCost('gpt-4o-mini', inputTokens, outputTokens);
    
    await safeInsertUsage(supabase, {
      call_name: "Aff",
      user_id: userId,
      route: "/functions/v1/generate-affirmations",
      model: 'gpt-4o-mini',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      input_cost_usd: inputCost,
      output_cost_usd: outputCost,
      total_cost_usd: totalCost,
      meta: {
        openai_id: data?.id ?? null,
        topic: topic,
        onboarding_session_id: onboardingSessionId,
      }
    });
    
    const content = data.choices?.[0]?.message?.content || '';
    // Parse the affirmations (split by newlines and filter empty)
    const affirmations = content.split('\n').map((line)=>line.trim()).filter((line)=>line.length > 0 && !line.match(/^\d+[\.\)]/)) // Remove numbering if present
    .slice(0, 5); // Ensure only 5
    return new Response(JSON.stringify({
      affirmations
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating affirmations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: sanitizeErrorMessage(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
