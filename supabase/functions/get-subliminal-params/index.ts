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

// PROPRIETARY SUBLIMINAL AUDIO MIXING PARAMETERS
// These values are proprietary and must remain server-side

// Binaural beat frequencies for different brain states (proprietary)
const BINAURAL_FREQUENCIES = {
  delta: { base: 200, offset: 2 },    // 200 Hz base, 2 Hz beat (0.5-4 Hz deep sleep)
  theta: { base: 200, offset: 6 },    // 200 Hz base, 6 Hz beat (4-8 Hz meditation)
  alpha: { base: 250, offset: 10 },   // 250 Hz base, 10 Hz beat (8-13 Hz relaxation)
  beta: { base: 300, offset: 20 },    // 300 Hz base, 20 Hz beat (13-30 Hz focus)
  gamma: { base: 400, offset: 40 },   // 400 Hz base, 40 Hz beat (30-100 Hz peak awareness)
};

// Binaural beat generation parameters (proprietary)
const BINAURAL_AMPLITUDE = 0.3; // Left/right channel amplitude for binaural beats

// Mixing gain parameters (proprietary)
const BINAURAL_GAIN = 0.4; // Moderate volume for binaural beats
const AFFIRMATION_GAIN_MULTIPLIER = 0.5; // Halve the volume: slider 100% = actual 50% volume
const LAYER_DELAY_SECONDS = 0.5; // Slight delay between layers
const LAYER_ATTENUATION = 0.05; // Each layer slightly quieter to create subliminal whisper effect

// Audio processing parameters (proprietary)
const TARGET_SAMPLE_RATE = 22050; // Half of standard 44100 Hz - reduces file size by ~50%
const AUDIO_DETECTION_THRESHOLD = 0.001; // Threshold for detecting if audio buffer has content

// Get all subliminal audio mixing parameters
function getSubliminalParams() {
  return {
    binauralFrequencies: BINAURAL_FREQUENCIES,
    binauralAmplitude: BINAURAL_AMPLITUDE,
    binauralGain: BINAURAL_GAIN,
    affirmationGainMultiplier: AFFIRMATION_GAIN_MULTIPLIER,
    layerDelaySeconds: LAYER_DELAY_SECONDS,
    layerAttenuation: LAYER_ATTENUATION,
    targetSampleRate: TARGET_SAMPLE_RATE,
    audioDetectionThreshold: AUDIO_DETECTION_THRESHOLD,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Return proprietary mixing parameters
    return new Response(
      JSON.stringify({
        params: getSubliminalParams(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting subliminal params:', error);
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

