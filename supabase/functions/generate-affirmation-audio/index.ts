import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
 * Calculate cost for TTS (Textto)
 * tts-1: $15 / 1,000,000 characters
 */
function calcTtsCost(chars: number) {
  return chars * (15 / 1_000_000);
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { affirmations, voice = 'alloy' } = await req.json();

    if (!affirmations || !Array.isArray(affirmations)) {
      throw new Error('Affirmations array is required');
    }

    // Set up Supabase client for logging (best-effort)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get user ID from auth header (optional for logging)
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (_) {
        // User extraction failed, continue without userId
      }
    }

    const OPENAI_API_KEY = Deno.env.get('Textto');
    if (!OPENAI_API_KEY) {
      throw new Error('Error. Please try again.');
    }

    // Combine affirmations with pauses between them
    const text = affirmations.join('. ... ');

    console.log('Generating TTS for:', text.substring(0, 100) + '...');

    // Generate speech from text using OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3',
        speed: 0.95, // Slightly slower for affirmations
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate speech';
      try {
        const error = await response.json();
        console.error('OpenAI TTS error:', error);
        errorMessage = error.error?.message || error.message || 'Failed to generate speech';
        
        // Handle specific OpenAI errors
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication failed.';
        } else if (response.status === 429) {
          errorMessage = 'Limit exceeded. Please try again.';
        } else if (response.status === 400) {
          errorMessage = error.error?.message || 'Invalid request.';
        }
      } catch (parseError) {
        // If response is not JSON, try to get text
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('TTS error (non-JSON):', errorText);
        errorMessage = `Error (${response.status}): ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    // Log OpenAI usage (best-effort, never throws)
    const chars = text.length;
    const totalCost = calcTtsCost(chars);
    
    await safeInsertUsage(supabase, {
      call_name: "Textto",
      user_id: userId,
      route: "/functions/v1/generate-affirmation-audio",
      model: 'tts-1',
      characters: chars,
      total_cost_usd: totalCost,
      meta: { voice: voice, format: 'mp3', speed: 0.95 }
    });

    // Convert audio buffer to base64 using Deno's standard library
    // This efficiently handles large files without stack overflow
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Use Deno's standard library base64 encoding (handles large buffers efficiently)
    const base64Audio = base64Encode(uint8Array);

    console.log('TTS generated successfully');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'mp3'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in generate-affirmation-audio:', error);
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
