import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  
  // Default safe message
  return defaultMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ⚠️ SERVER-ONLY: These audio specifications must NEVER be exposed to client-side code
// This file is a Deno edge function and should never be imported in client React code
// PROPRIETARY FREEPLAY AUDIO SYNTHESIS PARAMETERS
// These values are proprietary and must remain server-side

// Master audio chain parameters (proprietary)
const MASTER_GAIN = 0.9;

// Lowpass filter parameters (proprietary)
const LOWPASS_FREQUENCY = 5500; // Lower frequency to reduce harshness and dial-tone quality
const LOWPASS_Q = 1.0; // Slightly higher Q for smoother rolloff

// Limiter/compressor parameters (proprietary)
const LIMITER_THRESHOLD = -3; // even less aggressive
const LIMITER_KNEE = 5; // softer knee
const LIMITER_RATIO = 4; // very soft compression
const LIMITER_ATTACK = 0.02; // slower attack
const LIMITER_RELEASE = 0.3; // longer release

// Note envelope parameters (proprietary)
const NOTE_ATTACK = 0.05; // Softer attack for more piano-like sound
const NOTE_RELEASE = 0.2; // Smooth release
const NOTE_PEAK_LEVEL = 0.3; // Higher volume to reduce muffling

// Continuous note parameters (proprietary)
const CONTINUOUS_ATTACK = 0.01; // Slightly softer attack
const CONTINUOUS_SUSTAIN = 0.22;
const CONTINUOUS_RELEASE = 0.06;

// Offline rendering parameters (proprietary)
const OFFLINE_ATTACK = 0.01; // Slightly softer attack
const OFFLINE_DECAY = 0.06;
const OFFLINE_SUSTAIN = 0.22;
const OFFLINE_PEAK_LEVEL = 0.35;
const OFFLINE_RELEASE_MULTIPLIER = 0.25; // release = duration * this value, clamped between 0.04 and 0.12

// Audio processing parameters (proprietary)
const SAMPLE_RATE = 44100; // Use 44100 Hz sample rate for good quality

// Get all freeplay audio synthesis parameters
function getFreeplayParams() {
  return {
    masterGain: MASTER_GAIN,
    lowpass: {
      frequency: LOWPASS_FREQUENCY,
      Q: LOWPASS_Q,
    },
    limiter: {
      threshold: LIMITER_THRESHOLD,
      knee: LIMITER_KNEE,
      ratio: LIMITER_RATIO,
      attack: LIMITER_ATTACK,
      release: LIMITER_RELEASE,
    },
    note: {
      attack: NOTE_ATTACK,
      release: NOTE_RELEASE,
      peakLevel: NOTE_PEAK_LEVEL,
    },
    continuous: {
      attack: CONTINUOUS_ATTACK,
      sustain: CONTINUOUS_SUSTAIN,
      release: CONTINUOUS_RELEASE,
    },
    offline: {
      attack: OFFLINE_ATTACK,
      decay: OFFLINE_DECAY,
      sustain: OFFLINE_SUSTAIN,
      peakLevel: OFFLINE_PEAK_LEVEL,
      releaseMultiplier: OFFLINE_RELEASE_MULTIPLIER,
    },
    sampleRate: SAMPLE_RATE,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Return proprietary audio synthesis parameters
    return new Response(
      JSON.stringify({
        params: getFreeplayParams(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting freeplay params:', error);
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error),
        params: null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

