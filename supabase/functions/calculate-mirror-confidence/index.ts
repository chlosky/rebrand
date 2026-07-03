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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// PROPRIETARY MIRROR MODE CALCULATIONS
// These formulas and calibration values are proprietary and must remain server-side

// Volume/Confidence Calibration constants (proprietary)
const REFERENCE = 0.00005; // Calibrated so that 70 dB sustained = 100% on meter
const AMBIENT_DB = 33; // Normal ambient noise baseline
const TARGET_DB = 70;  // Target for 100% on meter
const DB_RANGE = TARGET_DB - AMBIENT_DB; // 37 dB range

// Mask Processing Parameters (proprietary)
const MASK_BACKGROUND_THRESHOLD = 0.35; // Below this = transparent (background)
const MASK_PERSON_THRESHOLD = 0.75; // Above this = fully opaque (person)
const MASK_TRANSITION_RANGE = 0.4; // Transition zone: 0.35 to 0.75
const MASK_TEMPORAL_WEIGHTS = [0.5, 0.3, 0.2]; // Frame blending weights (newest to oldest)
const MASK_MAX_HISTORY_FRAMES = 3; // Maximum frames to blend for temporal smoothing
const MASK_BLUR_AMOUNT = "1px"; // Edge smoothing blur amount

// Feedback message arrays (proprietary messaging strategy)
const LOW_CONFIDENCE_MESSAGES = [
  "A little louder!",
  "Speak it into existence!",
  "Speak Up!",
  "Affirm it!"
];

const MID_CONFIDENCE_MESSAGES = [
  "That's better.",
  "Keep going!",
  "You can do it!",
  "You've got this!"
];

const HIGH_CONFIDENCE_MESSAGES = [
  "That's it.",
  "Perfect!",
  "Great energy!",
  "Carry that forward."
];

// Calculate normalized volume from weighted RMS
function calculateNormalizedVolume(weightedRms: number, initializationSamples: number): number {
  // Ignore first few samples after initialization to avoid spikes
  if (initializationSamples < 15) {
    // First 15 samples (1.5 seconds) - treat as silence to avoid initialization spikes
    return 0;
  }

  // Cap initial readings to prevent false spikes
  if (initializationSamples < 30) {
    // Cap at ambient level (33 dB = ~5% on meter) during warm-up period
    const db = 20 * Math.log10(weightedRms / REFERENCE);
    if (db > AMBIENT_DB) {
      // During warm-up, treat anything above ambient as ambient
      return 0.05;
    }
  }

  // Convert A-weighted RMS to decibels
  const db = 20 * Math.log10(weightedRms / REFERENCE);

  // Clamp dB to reasonable range
  const clampedDb = Math.min(100, Math.max(0, db));

  // Proportional scaling: 33 dB → 5%, 70 dB → 100%
  // Formula: 5% + ((db - 33) / 37) * 95%
  // This gives smooth, proportional scaling with no breakpoints
  let normalizedVolume: number;
  if (clampedDb <= AMBIENT_DB) {
    // Below ambient: scale 0-33 dB → 0-5%
    normalizedVolume = (clampedDb / AMBIENT_DB) * 0.05;
  } else {
    // Above ambient: proportional scale from 33 dB to 70 dB
    normalizedVolume = 0.05 + ((clampedDb - AMBIENT_DB) / DB_RANGE) * 0.95;
  }

  // Clamp to 0-1 range
  return Math.min(1, Math.max(0, normalizedVolume));
}

// Calculate moving average from volume history
function calculateMovingAverage(volumeHistory: number[]): number {
  if (volumeHistory.length === 0) {
    return 0;
  }
  
  // Calculate simple average of all samples
  const sum = volumeHistory.reduce((a, b) => a + b, 0);
  return sum / volumeHistory.length;
}

// Generate feedback message based on confidence level
function generateFeedbackMessage(confidence: number, timeSinceLastFeedback: number): string | null {
  // Only generate feedback every 7 seconds
  if (timeSinceLastFeedback < 7000) {
    return null;
  }

  const confidencePercent = confidence * 100;
  let message = "";

  if (confidencePercent < 30) {
    // LOW Volume (Under 30%)
    message = LOW_CONFIDENCE_MESSAGES[Math.floor(Math.random() * LOW_CONFIDENCE_MESSAGES.length)];
  } else if (confidencePercent >= 30 && confidencePercent <= 70) {
    // MID Volume (31% to 70%)
    message = MID_CONFIDENCE_MESSAGES[Math.floor(Math.random() * MID_CONFIDENCE_MESSAGES.length)];
  } else {
    // HIGH Volume (71% to 100%)
    message = HIGH_CONFIDENCE_MESSAGES[Math.floor(Math.random() * HIGH_CONFIDENCE_MESSAGES.length)];
  }

  return message || null;
}

// Get mask processing parameters (proprietary thresholds and weights)
function getMaskProcessingParams() {
  return {
    backgroundThreshold: MASK_BACKGROUND_THRESHOLD,
    personThreshold: MASK_PERSON_THRESHOLD,
    transitionRange: MASK_TRANSITION_RANGE,
    temporalWeights: MASK_TEMPORAL_WEIGHTS,
    maxHistoryFrames: MASK_MAX_HISTORY_FRAMES,
    blurAmount: MASK_BLUR_AMOUNT,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { weightedRms, initializationSamples, volumeHistory, timeSinceLastFeedback, getMaskParams } = await req.json();

    // If client requests mask parameters only (for initialization)
    if (getMaskParams === true) {
      return new Response(
        JSON.stringify({
          maskParams: getMaskProcessingParams(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate input for volume calculation
    if (typeof weightedRms !== 'number' || isNaN(weightedRms)) {
      throw new Error('Invalid weightedRms');
    }
    if (typeof initializationSamples !== 'number' || initializationSamples < 0) {
      throw new Error('Invalid initializationSamples');
    }
    if (!Array.isArray(volumeHistory)) {
      throw new Error('Invalid volumeHistory');
    }
    if (typeof timeSinceLastFeedback !== 'number' || timeSinceLastFeedback < 0) {
      throw new Error('Invalid timeSinceLastFeedback');
    }

    // Validate input
    if (typeof weightedRms !== 'number' || isNaN(weightedRms)) {
      throw new Error('Invalid weightedRms');
    }
    if (typeof initializationSamples !== 'number' || initializationSamples < 0) {
      throw new Error('Invalid initializationSamples');
    }
    if (!Array.isArray(volumeHistory)) {
      throw new Error('Invalid volumeHistory');
    }
    if (typeof timeSinceLastFeedback !== 'number' || timeSinceLastFeedback < 0) {
      throw new Error('Invalid timeSinceLastFeedback');
    }

    // Calculate normalized volume using proprietary formula
    const normalizedVolume = calculateNormalizedVolume(weightedRms, initializationSamples);

    // Update volume history (client maintains the array, we just add the new value)
    const updatedVolumeHistory = [...volumeHistory, normalizedVolume];
    
    // Maintain moving window of 25 samples (2.5 seconds at 100ms intervals)
    const trimmedHistory = updatedVolumeHistory.length > 25 
      ? updatedVolumeHistory.slice(-25) 
      : updatedVolumeHistory;

    // Calculate moving average (confidence score)
    const confidence = calculateMovingAverage(trimmedHistory);

    // Generate feedback message if needed
    const feedbackMessage = generateFeedbackMessage(confidence, timeSinceLastFeedback);

    return new Response(
      JSON.stringify({
        confidence,
        normalizedVolume,
        volumeHistory: trimmedHistory,
        feedbackMessage,
        // Include mask params in response so client can use them
        maskParams: getMaskProcessingParams(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error calculating mirror confidence:', error);
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error),
        confidence: 0,
        normalizedVolume: 0,
        volumeHistory: [],
        feedbackMessage: null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

