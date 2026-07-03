import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import i18n from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import type { AffirmationSet } from "@/lib/affirmations-data";
import { getLocalizedPremadeSets } from "@/lib/affirmations-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import mirrorBackground from "@/assets/mirror-background.png";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/useUserTier";
import { hasFeatureAccess } from "@/lib/featureGating";
import { bootstrapCanvasOverlay, clearAndSetDpr } from "@/lib/overlayBootstrap";
import * as bodyPix from "@tensorflow-models/body-pix";
import * as tf from "@tensorflow/tfjs";

const SPEED_OPTIONS = [
{ value: 0.5, label: "0.5x" },
{ value: 1, label: "1x" },
{ value: 1.5, label: "1.5x" },
{ value: 2, label: "2x" },
];

// Brand-new, minimal mirror rehearsal page (no reused code)
// Shows camera when started and provides a red Stop button.
const MirrorRehearsalWeb: React.FC = () => {
const { t } = useTranslation("tools");
const isMobile = useIsMobile();
const { theme } = useTheme();
const headerChrome =
  theme === "dark"
    ? { className: "border-b border-white/10 bg-[#0f0d14]", style: { backgroundColor: "#0f0d14" } }
    : { className: "bg-background", style: { backgroundColor: "#ffffff" } };
const { user } = useAuth();
const navigate = useNavigate();
const { tier, status } = useUserTier();
const planGate = useMemo(() => ({ tier, status }), [tier, status]);
const hasScenesAccess = hasFeatureAccess(planGate, 'scenes');
const hasMeterAccess = hasFeatureAccess(planGate, 'confidence_meter_feedback');

useEffect(() => {
if (user === null) {
navigate("/login", { replace: true });
}
}, [user, navigate]);

const videoRef = useRef<HTMLVideoElement | null>(null);
const streamRef = useRef<MediaStream | null>(null);
const detectionIntervalRef = useRef<number | null>(null);
const lastFeedbackTimeRef = useRef<number>(0);
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);
const dataArrayRef = useRef<Uint8Array | null>(null);
const frequencyDataRef = useRef<Uint8Array | null>(null);
const volumeHistoryRef = useRef<number[]>([]); // Simple history for averaging
const lastMeterUpdateRef = useRef<number>(0); // Track when meter was last updated
const initializationSamplesRef = useRef<number>(0); // Track initialization samples to ignore spikes
const [active, setActive] = useState(false);
const [ready, setReady] = useState(false);
const [error, setError] = useState<string | null>(null);
const [confidence, setConfidence] = useState<number>(0);
const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
const [showMeter, setShowMeter] = useState<boolean>(false);

// Affirmation settings
const [affirmationSets, setAffirmationSets] = useState<AffirmationSet[]>([]);
const [selectedSetId, setSelectedSetId] = useState<string>("");
const [speed, setSpeed] = useState(1);
const [currentAffirmation, setCurrentAffirmation] = useState("");

// Pack settings
const [selectedPack, setSelectedPack] = useState<string>("");

// Mask readiness state - triggers re-render when mask becomes available
const [maskReady, setMaskReady] = useState(false);
// Track if canvas has drawn at least once (to hide video)
const [canvasHasDrawn, setCanvasHasDrawn] = useState(false);
const canvasHasDrawnRef = useRef(false);

// Remove deprecated flower overlay selection if encountered
useEffect(() => {
if (selectedPack === "flower-bloom-overlay") {
setSelectedPack("none");
}
}, [selectedPack]);
const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
const moneyAnimationFrameRef = useRef<number | null>(null);
const heartsAnimationFrameRef = useRef<number | null>(null);
const moneyParticlesRef = useRef<Array<{
x: number;
y: number;
speed: number;
rotation: number;
rotationSpeed: number;
size: number;
drift: number; // Horizontal drift
opacity: number;
glow: number; // Glow intensity
direction: number; // 1 for down, -1 for up (for ping-pong loop)
}>>([]);
const lastSpawnTimeRef = useRef<number>(0);
const heartsParticlesRef = useRef<Array<{
x: number;
y: number;
speed: number;
rotation: number;
rotationSpeed: number;
size: number;
drift: number; // Horizontal drift
opacity: number;
glow: number; // Glow intensity
direction: number; // 1 for down, -1 for up (for ping-pong loop)
}>>([]);
const lastHeartSpawnTimeRef = useRef<number>(0);
const goldSparksAnimationFrameRef = useRef<number | null>(null);
const goldSparksParticlesRef = useRef<Array<{
x: number;
y: number;
speed: number;
angle: number;
size: number;
opacity: number;
twinkleSpeed: number;
life: number;
}>>([]);
const flowerAnimationFrameRef = useRef<number | null>(null);
const flowerParticlesRef = useRef<Array<{
x: number;
y: number;
size: number;
bloomProgress: number; // 0 to 1, how much the flower has bloomed
bloomSpeed: number;
rotation: number;
rotationSpeed: number;
petalCount: number;
colorHue: number; // For vibrant, happy colors
opacity: number;
glow: number;
}>>([]);
const rainThunderAnimationFrameRef = useRef<number | null>(null);
const rainParticlesRef = useRef<Array<{
x: number;
y: number;
speed: number;
length: number;
drift: number;
opacity: number;
}>>([]);
const rainAudioCtxRef = useRef<AudioContext | null>(null);
const rainNoiseRef = useRef<AudioBufferSourceNode | null>(null);
const rainGainRef = useRef<GainNode | null>(null);
const thunderGainRef = useRef<GainNode | null>(null);
const thunderTimeoutRef = useRef<number | null>(null);
const heartsAudioCtxRef = useRef<AudioContext | null>(null);
const heartsNoiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
const heartsNoiseGainRef = useRef<GainNode | null>(null);
  const heartsHarpIntervalRef = useRef<number | null>(null);
const coinsAnimationFrameRef = useRef<number | null>(null);
const coinsParticlesRef = useRef<Array<{
x: number;
y: number;
speed: number;
rotation: number;
rotationSpeed: number;
size: number;
drift: number; // Horizontal drift
opacity: number;
glow: number; // Glow intensity
direction: number; // 1 for down, -1 for up (for ping-pong loop)
}>>([]);
const lastCoinSpawnTimeRef = useRef<number>(0);
const coinsAudioCtxRef = useRef<AudioContext | null>(null);
const coinsMasterGainRef = useRef<GainNode | null>(null);
const coinsNoiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
const coinsNoiseGainRef = useRef<GainNode | null>(null);
const goldAudioCtxRef = useRef<AudioContext | null>(null);
const goldMasterGainRef = useRef<GainNode | null>(null);
const goldWindSourceRef = useRef<AudioBufferSourceNode | null>(null);
const goldWindGainRef = useRef<GainNode | null>(null);
const goldBirdIntervalRef = useRef<number | null>(null);
const rainShouldStartRef = useRef<boolean>(false);
const resumeAllAudioContexts = useCallback(async () => {
const contexts = [
heartsAudioCtxRef.current,
coinsAudioCtxRef.current,
goldAudioCtxRef.current,
rainAudioCtxRef.current,
summitWindAudioCtxRef.current,
];
await Promise.all(
contexts.map(async (ctx) => {
if (ctx && ctx.state === "suspended") {
try { await ctx.resume(); } catch {}
}
})
);
}, []);

// Explicit starters so we can tie to a user gesture (See Yourself click) for autoplay policies
const startRainAudio = useCallback(() => {
if (rainAudioCtxRef.current) return;
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") audioCtx.resume(); } catch {}
const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32;
const rainNoise = audioCtx.createBufferSource();
rainNoise.buffer = buffer;
rainNoise.loop = true;
const rainFilter = audioCtx.createBiquadFilter();
rainFilter.type = "lowpass";
rainFilter.frequency.value = 1400;
const rainGain = audioCtx.createGain();
rainGain.gain.value = 0.14;
const thunderNoise = audioCtx.createBufferSource();
thunderNoise.buffer = buffer;
thunderNoise.loop = true;
const thunderFilter = audioCtx.createBiquadFilter();
thunderFilter.type = "lowpass";
thunderFilter.frequency.value = 260;
const thunderGain = audioCtx.createGain();
thunderGain.gain.value = 0.0;
rainNoise.connect(rainFilter);
rainFilter.connect(rainGain);
rainGain.connect(audioCtx.destination);
thunderNoise.connect(thunderFilter);
thunderFilter.connect(thunderGain);
thunderGain.connect(audioCtx.destination);
rainNoise.start();
thunderNoise.start();
rainAudioCtxRef.current = audioCtx;
rainNoiseRef.current = rainNoise;
rainGainRef.current = rainGain;
thunderGainRef.current = thunderGain;
}, []);

const startSummitWindAudio = useCallback(() => {
if (summitWindAudioCtxRef.current) return;
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") audioCtx.resume(); } catch {}
const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.loop = true;
const hp = audioCtx.createBiquadFilter();
hp.type = "highpass";
hp.frequency.value = 100;
const lp = audioCtx.createBiquadFilter();
lp.type = "lowpass";
lp.frequency.value = 1400;
const gain = audioCtx.createGain();
gain.gain.value = 0.06;
source.connect(hp);
hp.connect(lp);
lp.connect(gain);
gain.connect(audioCtx.destination);
source.start();
summitWindAudioCtxRef.current = audioCtx;
summitWindSourceRef.current = source;
summitWindGainRef.current = gain;
}, []);

const stopHeartsAudio = () => {
    // Clear harp interval
    if (heartsHarpIntervalRef.current) {
      clearInterval(heartsHarpIntervalRef.current);
      heartsHarpIntervalRef.current = null;
    }
    
    // First, set gain to 0 to immediately silence audio
    if (heartsNoiseGainRef.current) {
      try {
        heartsNoiseGainRef.current.gain.cancelScheduledValues(heartsNoiseGainRef.current.context.currentTime);
        heartsNoiseGainRef.current.gain.setValueAtTime(0, heartsNoiseGainRef.current.context.currentTime);
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Stop audio source immediately
if (heartsNoiseSourceRef.current) {
      try { 
        heartsNoiseSourceRef.current.stop(); 
      } catch (e) {
        // Source may already be stopped, ignore error
      }
      try {
        heartsNoiseSourceRef.current.disconnect();
      } catch (e) {
        // May already be disconnected, ignore error
      }
heartsNoiseSourceRef.current = null;
}
    
    // Disconnect gain node
if (heartsNoiseGainRef.current) {
      try {
        heartsNoiseGainRef.current.disconnect();
      } catch (e) {
        // May already be disconnected, ignore error
      }
heartsNoiseGainRef.current = null;
}
    
    // Close audio context
if (heartsAudioCtxRef.current) {
      try {
        // Close async but don't wait - we want immediate stop
        heartsAudioCtxRef.current.close().catch(() => {});
      } catch (e) {
        // Context may already be closed, ignore error
      }
heartsAudioCtxRef.current = null;
}
};

const stopCoinsAudio = () => {
if (coinsNoiseSourceRef.current) {
try { coinsNoiseSourceRef.current.stop(); } catch {}
coinsNoiseSourceRef.current = null;
}
if (coinsNoiseGainRef.current) {
coinsNoiseGainRef.current.disconnect();
coinsNoiseGainRef.current = null;
}
if (coinsAudioCtxRef.current) {
try { coinsAudioCtxRef.current.close(); } catch {}
coinsAudioCtxRef.current = null;
coinsMasterGainRef.current = null;
}
};

const stopGoldAudio = () => {
if (goldBirdIntervalRef.current) {
clearInterval(goldBirdIntervalRef.current);
goldBirdIntervalRef.current = null;
}
if (goldWindSourceRef.current) {
try { goldWindSourceRef.current.stop(); } catch {}
goldWindSourceRef.current = null;
}
if (goldWindGainRef.current) {
goldWindGainRef.current.disconnect();
goldWindGainRef.current = null;
}
if (goldAudioCtxRef.current) {
try { goldAudioCtxRef.current.close(); } catch {}
goldAudioCtxRef.current = null;
goldMasterGainRef.current = null;
}
};

// Client-side confidence calculation (moved from edge function to avoid network calls)
const calculateConfidenceClientSide = (
  weightedRms: number,
  initializationSamples: number,
  volumeHistory: number[],
  timeSinceLastFeedback: number
) => {
  // Constants from edge function (proprietary calibration values)
  const REFERENCE = 0.00005; // Calibrated so that 70 dB sustained = 100% on meter
  const AMBIENT_DB = 33; // Normal ambient noise baseline
  const TARGET_DB = 70;  // Target for 100% on meter
  const DB_RANGE = TARGET_DB - AMBIENT_DB; // 37 dB range

  // Calculate normalized volume
  let normalizedVolume = 0;
  
  // Ignore first few samples after initialization to avoid spikes
  if (initializationSamples < 15) {
    // First 15 samples (1.5 seconds) - treat as silence to avoid initialization spikes
    normalizedVolume = 0;
  } else if (initializationSamples < 30) {
    // Cap initial readings to prevent false spikes
    // Cap at ambient level (33 dB = ~5% on meter) during warm-up period
    const db = 20 * Math.log10(weightedRms / REFERENCE);
    if (db > AMBIENT_DB) {
      // During warm-up, treat anything above ambient as ambient
      normalizedVolume = 0.05;
    } else {
      normalizedVolume = (db / AMBIENT_DB) * 0.05;
    }
  } else {
    // Convert A-weighted RMS to decibels
    const db = 20 * Math.log10(weightedRms / REFERENCE);
    
    // Clamp dB to reasonable range
    const clampedDb = Math.min(100, Math.max(0, db));
    
    // Proportional scaling: 33 dB ? 5%, 70 dB ? 100%
    if (clampedDb <= AMBIENT_DB) {
      // Below ambient: scale 0-33 dB ? 0-5%
      normalizedVolume = (clampedDb / AMBIENT_DB) * 0.05;
    } else {
      // Above ambient: proportional scale from 33 dB to 70 dB
      normalizedVolume = 0.05 + ((clampedDb - AMBIENT_DB) / DB_RANGE) * 0.95;
    }
    
    // Clamp to 0-1 range
    normalizedVolume = Math.min(1, Math.max(0, normalizedVolume));
  }

  // Update volume history (client maintains the array, we just add the new value)
  const updatedVolumeHistory = [...volumeHistory, normalizedVolume];
  
  // Maintain moving window of 25 samples (2.5 seconds at 100ms intervals)
  const trimmedHistory = updatedVolumeHistory.length > 25 
    ? updatedVolumeHistory.slice(-25) 
    : updatedVolumeHistory;

  // Calculate moving average (confidence score)
  const confidence = trimmedHistory.length > 0
    ? trimmedHistory.reduce((a, b) => a + b, 0) / trimmedHistory.length
    : 0;

  // Generate feedback message if needed (every 7 seconds)
  let feedbackMessage: string | null = null;
  if (timeSinceLastFeedback >= 7000) {
    const confidencePercent = confidence * 100;
    const LOW_MESSAGES = i18n.t("mirror.feedbackMessages.low", { ns: "tools", returnObjects: true }) as string[];
    const MID_MESSAGES = i18n.t("mirror.feedbackMessages.mid", { ns: "tools", returnObjects: true }) as string[];
    const HIGH_MESSAGES = i18n.t("mirror.feedbackMessages.high", { ns: "tools", returnObjects: true }) as string[];
    
    if (confidencePercent < 30) {
      feedbackMessage = LOW_MESSAGES[Math.floor(Math.random() * LOW_MESSAGES.length)];
    } else if (confidencePercent >= 30 && confidencePercent <= 70) {
      feedbackMessage = MID_MESSAGES[Math.floor(Math.random() * MID_MESSAGES.length)];
    } else {
      feedbackMessage = HIGH_MESSAGES[Math.floor(Math.random() * HIGH_MESSAGES.length)];
    }
  }

  return {
    confidence,
    normalizedVolume,
    volumeHistory: trimmedHistory,
    feedbackMessage,
  };
};

// Shared segmentation + masking helpers (reuse Summit/Rain pipeline)
// BodyPix (TensorFlow.js) segmentation (replaces MediaPipe)
// Singleton pattern for segmentation instance - using refs to persist across renders
const segmentationPromiseRef = useRef<Promise<any> | null>(null);
const segmentationInstanceRef = useRef<any>(null);
const bodyPixMaskImageDataRef = useRef<ImageData | null>(null);

const ensureSegmentationShared = async (): Promise<any | null> => {
  // If segmentation has failed, don't retry (prevents infinite error loops)
  if (segmentationFailedRef.current) return null;
  if (segmentationInstanceRef.current) return segmentationInstanceRef.current;
  if (segmentationPromiseRef.current) return segmentationPromiseRef.current;

  segmentationPromiseRef.current = (async () => {
    try {
      // Initialize TFJS backend. On mobile, prefer CPU for stability; on desktop, prefer WebGL for speed.
      try {
        if (isMobile) {
          // Mobile: prefer CPU backend for stability - no fallback to WebGL
          if (tf.getBackend() !== "cpu") {
            await tf.setBackend("cpu");
          }
        } else {
          // Desktop: prefer WebGL for speed
          if (tf.getBackend() !== "webgl") {
            await tf.setBackend("webgl");
          }
        }
      } catch (e) {
        // On mobile, fail immediately if CPU backend fails (don't try WebGL)
        if (isMobile) {
          throw e; // Re-throw to be caught by outer catch block
        }
        // Desktop: fallback to CPU if WebGL fails
        try {
          await tf.setBackend("cpu");
        } catch {}
      }
      await tf.ready();

      console.log("[Segmentation] Loading BodyPix...");
      const net = await bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
        // Self-hosted model to avoid 504s/blocked access to storage.googleapis.com
        modelUrl: `${import.meta.env.BASE_URL}models/bodypix/mobilenet/quant2/075/model-stride16.json`,
      });
      console.log("[Segmentation] BodyPix loaded");

      segmentationInstanceRef.current = net;
      summitSegmentationRef.current = net;

      if (!summitSegInputRef.current) {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 512;
        summitSegInputRef.current = c;
      }

      return net;
    } catch (e) {
      // Only log once to prevent console spam
      if (!segmentationFailedRef.current) {
        console.warn("Segmentation initialization failed", e);
      }
      segmentationFailedRef.current = true;
      maskHistoryRef.current = [];
      maskHistoryForBlendingRef.current = [];
      summitMaskReadyRef.current = false;
      summitSegMaskRef.current = null;
      bodyPixMaskImageDataRef.current = null;
      segmentationPromiseRef.current = null;
      segmentationInstanceRef.current = null;
      setMaskReady(false);
      return null;
    }
  })();

  return segmentationPromiseRef.current;
};

const runSegmentationShared = async () => {
  if (segmentationFailedRef.current) return;
  const now = performance.now();
  // BodyPix is heavier than MediaPipe; run at a slightly lower rate.
  // Use longer throttle on mobile for stability (600ms vs 150ms on desktop)
  const throttleMs = isMobile ? 600 : 150;
  if (now - summitSegLastRunRef.current < throttleMs) return;
  
  // Skip if segmentation is still processing (prevent queue buildup on mobile)
  if (isMobile && summitSegProcessingRef.current) return;
  
  if (!summitSegmentationRef.current || !videoRef.current || !summitSegInputRef.current) return;

  const video = videoRef.current;
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    summitSegProcessingRef.current = false;
    return;
  }

  summitSegLastRunRef.current = now;
  summitSegProcessingRef.current = true;

  const input = summitSegInputRef.current;
  const vw = video.videoWidth;
  const vh = video.videoHeight;

// CRITICAL FIX: Match segmentation aspect ratio to display (CSS object-cover crop)
const container = video.parentElement;
if (!container) {
  summitSegProcessingRef.current = false;
  return;
}

const displayWidth = container.clientWidth;
const displayHeight = container.clientHeight;
const displayRatio = displayWidth / displayHeight;
const videoRatio = vw / vh;

// Higher resolution for sharper masks (like Zoom/Teams)
// Use even lower resolution on mobile for stability (320x180 vs 640x360)
let targetW = isMobile ? 320 : 960;
let targetH = isMobile ? 180 : 540;

// Match the crop that CSS object-cover applies
if (videoRatio > displayRatio) {
  // Video is wider - height fills, width crops
  targetH = isMobile ? 180 : 540;
  targetW = Math.floor((isMobile ? 180 : 540) * displayRatio);
} else {
  // Video is taller - width fills, height crops
  targetW = isMobile ? 320 : 960;
  targetH = Math.floor((isMobile ? 320 : 960) / displayRatio);
}

input.width = targetW;
input.height = targetH;

const ictx = input.getContext("2d", { willReadFrequently: true });
if (!ictx) return;

// Clear previous frame completely
ictx.clearRect(0, 0, targetW, targetH);
ictx.imageSmoothingEnabled = true;
// @ts-ignore
ictx.imageSmoothingQuality = "high";

// Draw video with cover-crop to match display (prevents mask misalignment)
// On mobile, zoom on face by cropping from top instead of center
const scale = Math.max(targetW / vw, targetH / vh);
const sw = targetW / scale;
const sh = targetH / scale;
const sx = (vw - sw) / 2;
// On mobile, crop from top (face area) instead of center to reduce shoulders
const sy = isMobile ? 0 : (vh - sh) / 2;
ictx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // Mark as processing to prevent queue buildup
  if (isMobile) {
    summitSegProcessingRef.current = true;
  }
  
  try {
    const net = summitSegmentationRef.current as bodyPix.BodyPix;
    const segmentation = await net.segmentPerson(input, {
      // NOTE: We mirror the final composite in canvas. We'll explicitly mirror the mask below
      // to ensure it tracks motion correctly regardless of BodyPix flip semantics.
      flipHorizontal: false,
      internalResolution: isMobile ? "low" : "medium",
      segmentationThreshold: isMobile ? 0.5 : 0.7, // Lower threshold on mobile for faster processing
    });

    // Convert segmentation (0/1) into a mask canvas where red channel is "confidence" (0..255).
    if (!summitSegMaskRef.current) {
      summitSegMaskRef.current = document.createElement("canvas");
    }
    const maskCanvas = summitSegMaskRef.current;
    if (maskCanvas.width !== segmentation.width || maskCanvas.height !== segmentation.height) {
      maskCanvas.width = segmentation.width;
      maskCanvas.height = segmentation.height;
      bodyPixMaskImageDataRef.current = null;
    }

    const mctx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!mctx) return;

    let img = bodyPixMaskImageDataRef.current;
    if (!img || img.width !== segmentation.width || img.height !== segmentation.height) {
      img = mctx.createImageData(segmentation.width, segmentation.height);
      bodyPixMaskImageDataRef.current = img;
    }

    const md = img.data;
    const sd = segmentation.data as Uint8Array;

    // IMPORTANT: Mirror the mask horizontally so it aligns with the mirrored camera feed.
    // sd is indexed row-major: i = y * width + x
    const mw = segmentation.width;
    const mh = segmentation.height;
    for (let y = 0; y < mh; y++) {
      const row = y * mw;
      for (let x = 0; x < mw; x++) {
        const srcI = row + x;
        const dstI = row + (mw - 1 - x);
        const v = sd[srcI] ? 255 : 0;
        const o = dstI * 4;
        md[o] = v;
        md[o + 1] = v;
        md[o + 2] = v;
        md[o + 3] = 255;
      }
    }

    mctx.putImageData(img, 0, 0);
    summitMaskReadyRef.current = true;
    setMaskReady(true);
  } catch (error) {
    // Mark failed for repeated critical errors (WebGL/context issues)
    if (error && typeof error === "object" && "message" in error) {
      const errorMsg = String((error as any).message || "");
      if (errorMsg.includes("WebGL") || errorMsg.includes("context") || errorMsg.includes("texImage2D")) {
        segmentationFailedRef.current = true;
      }
    }
  } finally {
    // Clear processing flag (mobile only)
    if (isMobile) {
      summitSegProcessingRef.current = false;
    }
  }
};

const processMaskShared = (displayWidth: number, displayHeight: number) => {
const raw = summitSegMaskRef.current as HTMLCanvasElement | null;
if (!raw || !summitMaskReadyRef.current) return null;

// Step 1: Create process canvas at display resolution (no DPR)
if (!maskProcessCanvasRef.current) {
maskProcessCanvasRef.current = document.createElement("canvas");
}
const proc = maskProcessCanvasRef.current;

// Only resize when dimensions change (prevents unnecessary clears)
if (proc.width !== displayWidth || proc.height !== displayHeight) {
proc.width = displayWidth;
proc.height = displayHeight;
}

const pctx = proc.getContext("2d", { willReadFrequently: true });
if (!pctx) return raw;

// CRITICAL: Use "copy" composite to completely replace pixels (prevents ghosting)
pctx.setTransform(1, 0, 0, 1, 0, 0);
pctx.globalCompositeOperation = "copy";
pctx.imageSmoothingEnabled = true;
// @ts-ignore
pctx.imageSmoothingQuality = "high";

// Draw raw mask (upscaling with smoothing)
pctx.drawImage(raw, 0, 0, displayWidth, displayHeight);

// Read pixel data for thresholding
const imgData = pctx.getImageData(0, 0, displayWidth, displayHeight);
const data = imgData.data;

// Use proprietary mask parameters from edge function
// On mobile, use stricter thresholds to reduce breakthrough/ghost
const baseMaskParams = maskParamsRef.current || {
  backgroundThreshold: 0.35,
  personThreshold: 0.75,
  transitionRange: 0.4,
  temporalWeights: [0.5, 0.3, 0.2],
  maxHistoryFrames: 3,
  blurAmount: "1px",
};

// Adjust thresholds on mobile to reduce breakthrough/ghost
const maskParams = isMobile ? {
  ...baseMaskParams,
  backgroundThreshold: 0.65, // Higher threshold = less breakthrough (was 0.35)
  personThreshold: 0.90, // Higher threshold = sharper edges, less ghost (was 0.75)
  transitionRange: 0.2, // Keep same transition range
} : baseMaskParams;

// Apply proprietary thresholds for mask processing
for (let i = 0; i < data.length; i += 4) {
const confidence = data[i] / 255;

let alpha: number;
if (confidence < maskParams.backgroundThreshold) {
alpha = 0; // Background - proprietary threshold
} else if (confidence > maskParams.personThreshold) {
alpha = 255; // Person - proprietary threshold
} else {
// Smooth transition zone using proprietary formula
const t = (confidence - maskParams.backgroundThreshold) / maskParams.transitionRange;
alpha = Math.round(t * 255);
}

data[i] = 255;
data[i + 1] = 255;
data[i + 2] = 255;
data[i + 3] = alpha;
}

// NEW: Temporal smoothing - blend with previous frames using proprietary weights
maskHistoryForBlendingRef.current.push(imgData);
if (maskHistoryForBlendingRef.current.length > maskParams.maxHistoryFrames) {
maskHistoryForBlendingRef.current.shift();
}

// Blend current frame with history if we have enough frames
if (maskHistoryForBlendingRef.current.length >= 2) {
const blended = pctx.createImageData(displayWidth, displayHeight);
const weights = maskParams.temporalWeights; // Proprietary blending weights

for (let i = 0; i < data.length; i += 4) {
let weightedSumAlpha = 0;
let totalWeight = 0;

// Blend alpha channel across frames
for (let j = 0; j < maskHistoryForBlendingRef.current.length; j++) {
const historyAlpha = maskHistoryForBlendingRef.current[j].data[i + 3];
weightedSumAlpha += historyAlpha * weights[j];
totalWeight += weights[j];
}

// Keep RGB white, blend alpha
blended.data[i] = 255;
blended.data[i + 1] = 255;
blended.data[i + 2] = 255;
blended.data[i + 3] = Math.round(weightedSumAlpha / totalWeight);
}

// Use blended result
pctx.putImageData(blended, 0, 0);
} else {
// Not enough history yet - use current frame
pctx.putImageData(imgData, 0, 0);
}

// Step 2: Apply minimal blur for edge smoothing
if (!maskFeatherCanvasRef.current) {
maskFeatherCanvasRef.current = document.createElement("canvas");
}
const feat = maskFeatherCanvasRef.current;

if (feat.width !== displayWidth || feat.height !== displayHeight) {
feat.width = displayWidth;
feat.height = displayHeight;
}

const fctx = feat.getContext("2d");
if (!fctx) return proc;

// CRITICAL: Use "copy" to prevent ghosting
fctx.setTransform(1, 0, 0, 1, 0, 0);
fctx.globalCompositeOperation = "copy";
fctx.imageSmoothingEnabled = true;
// @ts-ignore
fctx.imageSmoothingQuality = "high";

// Very light blur - just anti-aliasing (proprietary blur amount)
fctx.filter = `blur(${maskParams.blurAmount})`;
fctx.drawImage(proc, 0, 0);
fctx.filter = "none";

return feat;
};

// Helper: Draw video with cover-crop (like CSS object-cover) to match display
const drawVideoCover = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dw: number,
  dh: number,
  mirror = false
) => {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  
  // Calculate cover-crop: scale to fill, center crop (or top crop on mobile for face zoom)
  const scale = Math.max(dw / vw, dh / vh);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (vw - sw) / 2;
  // On mobile, crop from top (face area) instead of center to reduce shoulders
  const sy = isMobile ? 0 : (vh - sh) / 2;
  
  ctx.save();
  if (mirror) {
    ctx.translate(dw, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
  ctx.restore();
};

const ensurePersonCanvasShared = (displayWidth: number, displayHeight: number) => {
if (!personCanvasRef.current) {
personCanvasRef.current = document.createElement("canvas");
}

const c = personCanvasRef.current;

// Only resize when needed
if (c.width !== displayWidth || c.height !== displayHeight) {
c.width = displayWidth;
c.height = displayHeight;
}

if (!personCtxRef.current) {
personCtxRef.current = c.getContext("2d", { 
alpha: true,
willReadFrequently: false
});
}

return personCtxRef.current !== null;
};

const drawPersonShared = (ctx: CanvasRenderingContext2D, displayWidth: number, displayHeight: number) => {
if (!videoRef.current) return;

// Don't call runSegmentationShared here - it runs on a timer
// Just get the latest available mask
const processedMask = processMaskShared(displayWidth, displayHeight);

// Always ensure person canvas exists
if (!ensurePersonCanvasShared(displayWidth, displayHeight)) return;

const pctx = personCtxRef.current!;
const pcanvas = personCanvasRef.current!;

// CRITICAL: Use "copy" composite to replace pixels, not blend
pctx.setTransform(1, 0, 0, 1, 0, 0);
pctx.globalAlpha = 1.0;
pctx.globalCompositeOperation = "copy";
pctx.fillStyle = "rgba(0,0,0,0)";
pctx.fillRect(0, 0, displayWidth, displayHeight);

// Draw video with cover-crop (flipped for mirror effect) - matches CSS object-cover
drawVideoCover(pctx, videoRef.current, displayWidth, displayHeight, true);

// Apply mask if available
if (processedMask) {
pctx.globalCompositeOperation = "destination-in";
pctx.globalAlpha = 1.0;
pctx.drawImage(processedMask, 0, 0, displayWidth, displayHeight);
}

// Reset for any future ops
pctx.globalCompositeOperation = "source-over";
pctx.globalAlpha = 1.0;
pctx.imageSmoothingEnabled = true;
// @ts-ignore
pctx.imageSmoothingQuality = "high";

// Draw the masked person onto the main canvas
// The main canvas already has DPR transform applied by bootstrap
ctx.globalCompositeOperation = "source-over";
ctx.globalAlpha = 1.0;
ctx.imageSmoothingEnabled = true;
// @ts-ignore
ctx.imageSmoothingQuality = "high";
ctx.drawImage(pcanvas, 0, 0, displayWidth, displayHeight);
};

const startHeartsAudio = async () => {
    // Don't start if audio context already exists
if (heartsAudioCtxRef.current) return;
    
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") await audioCtx.resume(); } catch {}

// Create brown noise buffer (2 seconds, loops)
    const bufferLength = audioCtx.sampleRate * 2;
    const brownNoiseBuffer = audioCtx.createBuffer(1, bufferLength, audioCtx.sampleRate);
    const brownData = brownNoiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      brownData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = brownData[i];
    }
    
    // Brown noise source with gain 0.22 * 0.28 = 0.0616
    const brownSource = audioCtx.createBufferSource();
    brownSource.buffer = brownNoiseBuffer;
    brownSource.loop = true;
    
    const brownGain = audioCtx.createGain();
    brownGain.gain.value = 0.22 * 0.28; // 0.0616
    
    brownSource.connect(brownGain);
    brownGain.connect(audioCtx.destination);
    brownSource.start();
    
    heartsAudioCtxRef.current = audioCtx;
    heartsNoiseSourceRef.current = brownSource;
    heartsNoiseGainRef.current = brownGain;
    
    // Harp notes: pentatonic scale frequencies (C, D, E, G, A, C)
    const harpFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    
    const playHarpNote = () => {
      if (!heartsAudioCtxRef.current) return;
      const now = heartsAudioCtxRef.current.currentTime;
      const freq = harpFreqs[Math.floor(Math.random() * harpFreqs.length)];
      const noteDuration = 3.0; // 3 seconds
      
      // Triangle wave oscillator
      const osc = heartsAudioCtxRef.current.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      
      // Lowpass filter at 1800 Hz, Q=0.9
      const filter = heartsAudioCtxRef.current.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.9;
      
      // Exponential envelope: 0.0001 ? 0.12 @ 0.03s ? 0.0001 @ 2.6s
      const gain = heartsAudioCtxRef.current.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

       // Master gain 0.28
      const masterGain = heartsAudioCtxRef.current.createGain();
      masterGain.gain.value = 0.28;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + noteDuration);
    };
    
    // Play first harp note after 2 seconds, then every 4-8 seconds
    setTimeout(() => {
      playHarpNote();
      heartsHarpIntervalRef.current = window.setInterval(() => {
        if (!heartsAudioCtxRef.current || heartsAudioCtxRef.current.state === "suspended") {
          heartsAudioCtxRef.current?.resume().catch(() => {});
        }
        playHarpNote();
      }, 4000 + Math.random() * 4000); // 4-8 seconds
    }, 2000);
};

const startCoinsAudio = async () => {
if (coinsAudioCtxRef.current) return;
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") audioCtx.resume(); } catch {}
const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32;
const coinNoise = audioCtx.createBufferSource();
coinNoise.buffer = buffer;
coinNoise.loop = true;
const coinFilter = audioCtx.createBiquadFilter();
coinFilter.type = "lowpass";
coinFilter.frequency.value = 1400;
const coinGain = audioCtx.createGain();
coinGain.gain.value = 0.14;
coinNoise.connect(coinFilter);
coinFilter.connect(coinGain);
coinGain.connect(audioCtx.destination);
coinNoise.start();
coinsAudioCtxRef.current = audioCtx;
coinsNoiseSourceRef.current = coinNoise;
coinsNoiseGainRef.current = coinGain;
};

const startGoldAudio = async () => {
if (!goldAudioCtxRef.current) {
goldAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
}
const ctxA = goldAudioCtxRef.current;
if (!ctxA) return;
try { if (ctxA.state === "suspended") await ctxA.resume(); } catch {}

if (!goldMasterGainRef.current) {
const master = ctxA.createGain();
master.gain.value = 0.28;
master.connect(ctxA.destination);
goldMasterGainRef.current = master;
}

// Wind noise
const bufferSize = 2 * ctxA.sampleRate;
const noiseBuffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
const output = noiseBuffer.getChannelData(0);
let lastOut = 0;
for (let i = 0; i < bufferSize; i++) {
const white = Math.random() * 2 - 1;
output[i] = (lastOut + 0.02 * white) / 1.02;
lastOut = output[i];
}
const windSource = ctxA.createBufferSource();
windSource.buffer = noiseBuffer;
windSource.loop = true;

const windFilter = ctxA.createBiquadFilter();
windFilter.type = "lowpass";
windFilter.frequency.value = 900;
windFilter.Q.value = 0.7;

const windGain = ctxA.createGain();
windGain.gain.value = 0.18;

windSource.connect(windFilter);
windFilter.connect(windGain);
windGain.connect(goldMasterGainRef.current);

windSource.start();
goldWindSourceRef.current = windSource;
goldWindGainRef.current = windGain;

// Birds
const playBird = () => {
if (!goldAudioCtxRef.current || !goldMasterGainRef.current) return;
const now = goldAudioCtxRef.current.currentTime;
const osc = goldAudioCtxRef.current.createOscillator();
const gain = goldAudioCtxRef.current.createGain();
osc.type = "sine";
const base = 1200 + Math.random() * 800;
osc.frequency.setValueAtTime(base, now);
osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.25);
gain.gain.setValueAtTime(0.0001, now);
gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
osc.connect(gain);
gain.connect(goldMasterGainRef.current);
osc.start(now);
osc.stop(now + 0.6);
};

if (!goldBirdIntervalRef.current) {
playBird();
goldBirdIntervalRef.current = window.setInterval(() => {
if (!goldAudioCtxRef.current || goldAudioCtxRef.current.state === "suspended") {
goldAudioCtxRef.current?.resume().catch(() => {});
}
playBird();
}, 3200 + Math.random() * 2400);
}
};

  // Hearts audio: procedurally generated brown noise with occasional harp notes
const summitAnimationFrameRef = useRef<number | null>(null);
const summitSnowRef = useRef<Array<{
x: number;
y: number;
speed: number;
size: number;
drift: number;
opacity: number;
}>>([]);
const summitWindAudioCtxRef = useRef<AudioContext | null>(null);
const summitWindSourceRef = useRef<AudioBufferSourceNode | null>(null);
const summitWindGainRef = useRef<GainNode | null>(null);
const summitBgImageRef = useRef<HTMLImageElement | null>(null);
const summitBgReadyRef = useRef(false);
const summitBgCssUrl =
(import.meta.env.VITE_SUMMIT_BG_URL as string | undefined) ??
"/summit-bg.jpg.png";
const rainBgCssUrl =
(import.meta.env.VITE_RAIN_BG_URL as string | undefined) ??
"/rainforest.png";
const grassBgCssUrl =
(import.meta.env.VITE_GRASS_BG_URL as string | undefined) ??
"/Grass.png"; // match actual file name
const heartsBgCssUrl =
(import.meta.env.VITE_HEARTS_BG_URL as string | undefined) ??
"/Hearts.png";
const heartsBgImageRef = useRef<HTMLImageElement | null>(null);
const heartsBgReadyRef = useRef(false);
const coinsBgCssUrl =
(import.meta.env.VITE_COINS_BG_URL as string | undefined) ??
"/desert.png";
const coinsBgImageRef = useRef<HTMLImageElement | null>(null);
const coinsBgReadyRef = useRef(false);
const goldBgImageRef = useRef<HTMLImageElement | null>(null);
const goldBgReadyRef = useRef(false);
const personCanvasRef = useRef<HTMLCanvasElement | null>(null);
const personCtxRef = useRef<CanvasRenderingContext2D | null>(null);
const maskProcessCanvasRef = useRef<HTMLCanvasElement | null>(null);
const maskFeatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
const maskHistoryRef = useRef<ImageData[]>([]);
const maskHistoryForBlendingRef = useRef<ImageData[]>([]); // NEW: For temporal smoothing
const summitSegmentationRef = useRef<any>(null);
const summitSegMaskRef = useRef<HTMLCanvasElement | null>(null);
const summitSegInputRef = useRef<HTMLCanvasElement | null>(null);
const summitSegLastRunRef = useRef<number>(0);
const summitSegProcessingRef = useRef<boolean>(false);
const summitMaskReadyRef = useRef<boolean>(false);
const segmentationFailedRef = useRef<boolean>(false);
const lastUsedMaskRef = useRef<HTMLCanvasElement | null>(null); // Track which mask we last drew
// Mask processing parameters (fetched from edge function - proprietary)
const maskParamsRef = useRef<{
  backgroundThreshold: number;
  personThreshold: number;
  transitionRange: number;
  temporalWeights: number[];
  maxHistoryFrames: number;
  blurAmount: string;
} | null>(null);
const originalVideoFilterRef = useRef<string | null>(null);
const originalContainerTransformRef = useRef<string | null>(null);

const baseInterval = 2857; // Adjusted so 1x = old 1.75x speed, 2x = old 3.5x speed
const intervalMs = useMemo(() => baseInterval / speed, [speed]);

// Reset segmentation failure state on component mount to allow retry
useEffect(() => {
  segmentationFailedRef.current = false;
  console.log("[Mirror] Segmentation failure state reset on mount");
}, []);

// Fetch mask processing parameters from edge function (proprietary values)
useEffect(() => {
  const fetchMaskParams = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("calculate-mirror-confidence", {
        body: { getMaskParams: true },
      });

      if (error) {
        console.error("Error fetching mask parameters:", error);
        // Fallback to default values if fetch fails
        maskParamsRef.current = {
          backgroundThreshold: 0.35,
          personThreshold: 0.75,
          transitionRange: 0.4,
          temporalWeights: [0.5, 0.3, 0.2],
          maxHistoryFrames: 3,
          blurAmount: "1px",
        };
        return;
      }

      if (data?.maskParams) {
        maskParamsRef.current = data.maskParams;
      }
    } catch (err) {
      console.error("Error fetching mask parameters:", err);
      // Fallback to default values
      maskParamsRef.current = {
        backgroundThreshold: 0.35,
        personThreshold: 0.75,
        transitionRange: 0.4,
        temporalWeights: [0.5, 0.3, 0.2],
        maxHistoryFrames: 3,
        blurAmount: "1px",
      };
    }
  };

  fetchMaskParams();
}, []);

// Real-time volume detection
useEffect(() => {
if (!active || !ready || !videoRef.current) {
if (detectionIntervalRef.current) {
clearInterval(detectionIntervalRef.current);
detectionIntervalRef.current = null;
}
// Cleanup audio context
if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
audioContextRef.current.close();
audioContextRef.current = null;
analyserRef.current = null;
dataArrayRef.current = null;
}
return;
}

const video = videoRef.current;

// Initialize audio context for volume detection
if (!audioContextRef.current && streamRef.current && streamRef.current.getAudioTracks().length > 0) {
try {
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256; // Standard FFT size for time domain analysis
analyser.smoothingTimeConstant = 0; // No smoothing - instant response to actual volume

// Check if stream is still valid and has active tracks
if (streamRef.current && streamRef.current.getAudioTracks().length > 0 && streamRef.current.getAudioTracks()[0].readyState === 'live') {
  const source = audioContext.createMediaStreamSource(streamRef.current);
  source.connect(analyser);

  audioContextRef.current = audioContext;
  analyserRef.current = analyser;
  dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

  console.log("Audio context initialized for volume detection");
} else {
  // Stream is no longer valid, close the context
  audioContext.close();
}
} catch (error) {
console.warn("Audio context initialization failed:", error);
// If connection fails, don't retry - likely the stream is already in use
}
}

const detectVolume = async () => {
try {
// Ensure video is playing and has dimensions
if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
return;
}

// Calculate volume using frequency domain with A-weighting (more accurate for dB measurement)
if (analyserRef.current && frequencyDataRef.current && streamRef.current && streamRef.current.getAudioTracks().length > 0) {
analyserRef.current.getByteFrequencyData(frequencyDataRef.current);

const sampleRate = audioContextRef.current?.sampleRate || 44100;
const fftSize = analyserRef.current.fftSize;
const binCount = analyserRef.current.frequencyBinCount;
const nyquist = sampleRate / 2;

// Calculate A-weighted RMS (client-side frequency analysis - not proprietary)
let weightedSumSquares = 0;
let activeBins = 0;

for (let i = 0; i < binCount; i++) {
const frequency = (i * nyquist) / binCount;

// A-weighting filter coefficients
// Simplified A-weighting: reduces low and high frequencies to match human hearing
let aWeight = 1.0;
if (frequency > 0) {
const f2 = frequency * frequency;
const f4 = f2 * f2;
// A-weighting formula (simplified for performance)
const numerator = 12194.217 * 12194.217 * f4;
const denominator = (f2 + 20.6 * 20.6) * 
Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) * 
(f2 + 12194.217 * 12194.217);
aWeight = numerator / denominator;
}

// Convert frequency bin to amplitude (0-255 -> 0-1)
const amplitude = frequencyDataRef.current[i] / 255.0;

// Apply A-weighting and accumulate
weightedSumSquares += (amplitude * aWeight) * (amplitude * aWeight);
activeBins++;
}

const weightedRms = Math.sqrt(weightedSumSquares / activeBins);

// Increment initialization samples counter
initializationSamplesRef.current++;

// Calculate time since last feedback
const now = Date.now();
const timeSinceLastFeedback = now - lastFeedbackTimeRef.current;

// Calculate confidence client-side (moved from edge function to avoid network calls)
const result = calculateConfidenceClientSide(
  weightedRms,
  initializationSamplesRef.current,
  volumeHistoryRef.current,
  timeSinceLastFeedback
);

// Update volume history
volumeHistoryRef.current = result.volumeHistory;
// Update confidence score
setConfidence(result.confidence);
// Update feedback message if provided
if (result.feedbackMessage) {
  setFeedbackMessage(result.feedbackMessage);
  lastFeedbackTimeRef.current = now;
}
} else {
// No audio context or stream - set to 0
if (volumeHistoryRef.current.length > 0) {
// Gradually decrease if we lose audio
volumeHistoryRef.current.push(0);
if (volumeHistoryRef.current.length > 25) {
volumeHistoryRef.current.shift();
}
const movingAverage = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
setConfidence(movingAverage);
} else {
setConfidence(0);
}
}
} catch (error) {
console.error("Error detecting volume:", error);
setConfidence(0);
}
};

// Run detection every 100ms on desktop, 200ms on mobile to reduce CPU load
const detectionInterval = isMobile ? 200 : 100;
detectionIntervalRef.current = window.setInterval(() => {
detectVolume().catch((err) => {
console.error("Error in detectVolume:", err);
});
}, detectionInterval);

return () => {
if (detectionIntervalRef.current) {
clearInterval(detectionIntervalRef.current);
detectionIntervalRef.current = null;
}
// Cleanup audio context
if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
audioContextRef.current.close();
audioContextRef.current = null;
analyserRef.current = null;
dataArrayRef.current = null;
}
};
}, [active, ready]);

// Money overlay animation - Only when money overlay pack is selected
useEffect(() => {
if (!active || !ready || selectedPack !== "money-overlay") {
// Clean up animation
if (moneyAnimationFrameRef.current) {
cancelAnimationFrame(moneyAnimationFrameRef.current);
moneyAnimationFrameRef.current = null;
}
moneyParticlesRef.current = [];
// Clear canvas if it exists
const canvas = overlayCanvasRef.current;
if (canvas) {
const ctx = canvas.getContext('2d');
if (ctx) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}
return;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;

const container = canvas.parentElement;
if (!container) return;

let ctx: CanvasRenderingContext2D | null = null;
let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;
let globalDirection = 1; // Global direction for all bills: 1 = down, -1 = up
let lastDirectionChange = 0; // Track when direction last changed to prevent rapid oscillation

// Set canvas size to match container with device pixel ratio
const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;

if (displayWidth === 0 || displayHeight === 0) {
return false;
}

// Set actual size in memory (scaled for device pixel ratio)
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;

// Set display size (CSS pixels)
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';

// Set DPR transform (only place where we set it on resize)
ctx = canvas.getContext('2d');
if (ctx) {
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

return true;
};

// Spawn a single dollar bill (all bills use global direction)
const spawnBill = (width: number, height: number, startY?: number) => {
// All bills start based on global direction - if going down, start above; if going up, start below
const yPos = startY !== undefined ? startY : 
(globalDirection === 1 ? -60 - Math.random() * 40 : height + 60 + Math.random() * 40);

moneyParticlesRef.current.push({
x: Math.random() * width,
y: yPos,
speed: 1.5 + Math.random() * 1.5, // Smooth speed (2-3 px/frame)
rotation: Math.random() * Math.PI * 2,
rotationSpeed: (Math.random() - 0.5) * 0.08, // Gentle tumbling
size: 40 + Math.random() * 25, // Varied sizes (40-65px)
drift: (Math.random() - 0.5) * 0.3, // Subtle horizontal drift
opacity: 0.7 + Math.random() * 0.3, // 70-100% opacity
glow: 0.3 + Math.random() * 0.4, // Glow intensity
direction: globalDirection, // All bills use global direction
});
};

// Initialize screen with bills at various positions for seamless start
const initializeBills = (width: number, height: number) => {
moneyParticlesRef.current = [];
globalDirection = 1; // Start with all going down
lastDirectionChange = Date.now(); // Initialize direction change timer

// Pre-populate screen with bills distributed across the height
// Calculate how many bills we need to fill the screen height
const averageSpeed = 2.25; // Average of 1.5-3
const timeToCross = height / averageSpeed; // Frames to cross screen
const billsNeeded = Math.ceil(timeToCross / 25); // Spawn every ~25 frames worth

// Fill the entire screen height with bills, all moving in same direction
for (let i = 0; i < billsNeeded + 8; i++) {
const yPos = (i / (billsNeeded + 8)) * (height + 120) - 60; // Distribute across screen
spawnBill(width, height, yPos);
}
};

// Draw realistic US dollar bill
const drawDollarBill = (x: number, y: number, size: number, rotation: number, opacity: number, glow: number) => {
if (!ctx) return;

ctx.save();
ctx.translate(x, y);
ctx.rotate(rotation);

// Bill dimensions (US dollar ratio: ~2.61:1)
const billWidth = size * 2.4;
const billHeight = size;
const halfWidth = billWidth / 2;
const halfHeight = billHeight / 2;

// Outer glow effect
if (glow > 0) {
const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, billWidth * 0.8);
glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glow * 0.3 * opacity})`);
glowGradient.addColorStop(0.5, `rgba(255, 215, 0, ${glow * 0.15 * opacity})`);
glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
ctx.fillStyle = glowGradient;
ctx.fillRect(-halfWidth * 1.2, -halfHeight * 1.2, billWidth * 1.4, billHeight * 1.4);
}

// Main bill body - US dollar green
const billGradient = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
billGradient.addColorStop(0, `rgba(155, 194, 130, ${opacity})`); // Light green
billGradient.addColorStop(0.3, `rgba(135, 169, 107, ${opacity})`); // Medium green
billGradient.addColorStop(0.5, `rgba(120, 150, 95, ${opacity})`); // Darker green center
billGradient.addColorStop(0.7, `rgba(135, 169, 107, ${opacity})`); // Medium green
billGradient.addColorStop(1, `rgba(155, 194, 130, ${opacity})`); // Light green
ctx.fillStyle = billGradient;

// Rounded rectangle for bill
const cornerRadius = 4;
ctx.beginPath();
ctx.moveTo(-halfWidth + cornerRadius, -halfHeight);
ctx.lineTo(halfWidth - cornerRadius, -halfHeight);
ctx.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
ctx.lineTo(halfWidth, halfHeight - cornerRadius);
ctx.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
ctx.lineTo(-halfWidth + cornerRadius, halfHeight);
ctx.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
ctx.lineTo(-halfWidth, -halfHeight + cornerRadius);
ctx.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);
ctx.closePath();
ctx.fill();

// Border - subtle gold
ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.6})`;
ctx.lineWidth = 1.5;
ctx.stroke();

// Central seal/emblem (simplified)
ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.4})`;
ctx.beginPath();
ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
ctx.fill();

// Number "100" or "$" symbol (simplified)
ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
ctx.font = `bold ${size * 0.25}px Arial`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('$', 0, 0);

// Subtle texture lines
ctx.strokeStyle = `rgba(100, 130, 80, ${opacity * 0.3})`;
ctx.lineWidth = 0.5;
for (let i = -halfWidth + 8; i < halfWidth - 8; i += 6) {
ctx.beginPath();
ctx.moveTo(i, -halfHeight + 4);
ctx.lineTo(i, halfHeight - 4);
ctx.stroke();
}

// Highlight/shine effect
const shineGradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
shineGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.2})`);
shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
ctx.fillStyle = shineGradient;
ctx.fill();

ctx.restore();
};

// Animation loop
const animate = () => {
if (!active || !ready || selectedPack !== "money-overlay" || !ctx) {
return;
}

// Update canvas size if needed
const rect = container.getBoundingClientRect();
const currentWidth = rect.width;
const currentHeight = rect.height;

if (currentWidth !== displayWidth || currentHeight !== displayHeight) {
if (updateCanvasSize()) {
// Reinitialize particles with new dimensions - pre-populate for seamless start
initializeBills(displayWidth, displayHeight);
lastSpawnTimeRef.current = Date.now();
}
}

if (displayWidth === 0 || displayHeight === 0) {
moneyAnimationFrameRef.current = requestAnimationFrame(animate);
return;
}

const now = Date.now();

// Spawn new bills more frequently for seamless flow
// Spawn 1 bill every 200-350ms to ensure continuous coverage
if (now - lastSpawnTimeRef.current > 200 + Math.random() * 150) {
spawnBill(displayWidth, displayHeight);
lastSpawnTimeRef.current = now;
}

// Clear canvas and set DPR transform (no compounding)
clearAndSetDpr(ctx, canvas, dpr);

// Check if bills have reached boundary and need to reverse together
// Add cooldown to prevent rapid oscillation (wait at least 500ms between direction changes)
const timeSinceLastChange = now - lastDirectionChange;
const minTimeBetweenChanges = 500; // Minimum 500ms between direction changes

if (timeSinceLastChange > minTimeBetweenChanges) {
if (globalDirection === 1) {
// Moving down - check if most bills have reached bottom
const billsAtBottom = moneyParticlesRef.current.filter(p => p.y >= displayHeight - 20).length;
if (billsAtBottom >= moneyParticlesRef.current.length * 0.7) {
// 70% of bills reached bottom, reverse direction
globalDirection = -1;
lastDirectionChange = now;
}
} else {
// Moving up - check if most bills have reached top
const billsAtTop = moneyParticlesRef.current.filter(p => p.y <= 20).length;
if (billsAtTop >= moneyParticlesRef.current.length * 0.7) {
// 70% of bills reached top, reverse direction
globalDirection = 1;
lastDirectionChange = now;
}
}
}

// Update and draw particles - all use global direction
moneyParticlesRef.current = moneyParticlesRef.current.filter((particle) => {
// Update position - all bills use global direction
particle.y += particle.speed * globalDirection;
particle.x += particle.drift; // Subtle horizontal drift

// Update rotation (tumbling effect)
particle.rotation += particle.rotationSpeed;

// Update particle's direction to match global (for consistency)
particle.direction = globalDirection;

// Wrap particles that go too far off screen to the opposite side for seamless loop
if (globalDirection === 1 && particle.y > displayHeight + 80) {
// Moving down and went too far - wrap to top
particle.y = -60 - Math.random() * 40;
} else if (globalDirection === -1 && particle.y < -80) {
// Moving up and went too far - wrap to bottom
particle.y = displayHeight + 60 + Math.random() * 40;
}

// Calculate fade-out near boundaries for seamless transition
const fadeZone = 60; // Fade zone size
let finalOpacity = particle.opacity;

if (globalDirection === 1) {
// Moving down - fade as approaching bottom
if (particle.y > displayHeight - fadeZone) {
const fadeProgress = (particle.y - (displayHeight - fadeZone)) / fadeZone;
finalOpacity = particle.opacity * (1 - Math.min(fadeProgress, 1) * 0.4); // Fade to 60% at boundary
}
} else {
// Moving up - fade as approaching top
if (particle.y < fadeZone) {
const fadeProgress = (fadeZone - particle.y) / fadeZone;
finalOpacity = particle.opacity * (1 - Math.min(fadeProgress, 1) * 0.4); // Fade to 60% at boundary
}
}

// Draw bill with adjusted opacity for fade-out
drawDollarBill(
particle.x,
particle.y,
particle.size,
particle.rotation,
finalOpacity,
particle.glow * (finalOpacity / particle.opacity) // Fade glow too
);

return true; // Keep all particles
});

moneyAnimationFrameRef.current = requestAnimationFrame(animate);
};

// Initialize

requestAnimationFrame(() => {
const rect = container.getBoundingClientRect();
const currentDisplayWidth = rect.width;
const currentDisplayHeight = rect.height;

if (currentDisplayWidth === 0 || currentDisplayHeight === 0) {
// Retry after a short delay
setTimeout(() => {
const retryRect = container.getBoundingClientRect();
if (retryRect.width > 0 && retryRect.height > 0) {
if (updateCanvasSize()) {
moneyParticlesRef.current = [];
lastSpawnTimeRef.current = Date.now();
moneyAnimationFrameRef.current = requestAnimationFrame(animate);
}
}
}, 100);
return;
}

if (updateCanvasSize()) {
// Initialize with bills pre-populated across screen for seamless start
initializeBills(displayWidth, displayHeight);
lastSpawnTimeRef.current = Date.now();
moneyAnimationFrameRef.current = requestAnimationFrame(animate);
}
});

window.addEventListener('resize', updateCanvasSize);

return () => {
window.removeEventListener('resize', updateCanvasSize);
if (moneyAnimationFrameRef.current) {
cancelAnimationFrame(moneyAnimationFrameRef.current);
moneyAnimationFrameRef.current = null;
}
};
}, [active, ready, selectedPack]);

// Hearts overlay animation - Only when hearts scene is selected
useEffect(() => {
    // IMMEDIATE cleanup when scene is not active - stop audio first
if (!active || !ready || selectedPack !== "hearts-overlay") {
      // Stop audio IMMEDIATELY before any other cleanup
      stopHeartsAudio();
      
// Clean up animation
if (heartsAnimationFrameRef.current) {
cancelAnimationFrame(heartsAnimationFrameRef.current);
heartsAnimationFrameRef.current = null;
}
heartsParticlesRef.current = [];
      
// Clear canvas if it exists and no other overlay is active
      if (selectedPack !== "money-overlay" && selectedPack !== "coins-overlay" && selectedPack !== "gold-sparks-overlay" && selectedPack !== "summit-top" && selectedPack !== "rain-thunder-overlay") {
const canvas = overlayCanvasRef.current;
if (canvas) {
const ctx = canvas.getContext('2d');
if (ctx) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}
}
return;
}

// Ensure segmentation is ready for masking
// Don't reset mask state - preserve existing mask for smooth transitions
// Only try to initialize if it hasn't failed before
if (!segmentationFailedRef.current) {
  ensureSegmentationShared();
  runSegmentationShared();
}

// Preload hearts background
if (!heartsBgImageRef.current) {
const img = new Image();
img.src = heartsBgCssUrl;
img.onload = () => { heartsBgReadyRef.current = true; };
img.onerror = () => { heartsBgReadyRef.current = false; };
heartsBgImageRef.current = img;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;

const container = canvas.parentElement;
if (!container) return;

let ctx: CanvasRenderingContext2D | null = null;
let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;
let globalDirection = 1; // Global direction for all hearts: 1 = down, -1 = up
let lastDirectionChange = 0; // Track when direction last changed

// Set canvas size to match container with device pixel ratio
const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;

if (displayWidth === 0 || displayHeight === 0) {
return false;
}

// Set actual size in memory (scaled for device pixel ratio)
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;

// Set display size (CSS pixels)
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';

// Set DPR transform (only place where we set it on resize)
ctx = canvas.getContext('2d');
if (ctx) {
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

return true;
};

const drawHeartsBackground = () => {
if (!ctx) return;
if (heartsBgReadyRef.current && heartsBgImageRef.current) {
const img = heartsBgImageRef.current;
const iw = img.naturalWidth;
const ih = img.naturalHeight;
if (iw && ih) {
const scale = Math.max(displayWidth / iw, displayHeight / ih);
const sw = iw * scale;
const sh = ih * scale;
const dx = (displayWidth - sw) / 2;
const dy = (displayHeight - sh) / 2;
ctx.drawImage(img, dx, dy, sw, sh);
return;
}
}
// fallback gradient
const grad = ctx.createLinearGradient(0, 0, 0, displayHeight);
grad.addColorStop(0, "rgba(255, 220, 230, 0.9)");
grad.addColorStop(1, "rgba(255, 200, 215, 0.8)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, displayWidth, displayHeight);
};

// Spawn a single glassmorphic heart (all hearts use global direction)
const spawnHeart = (width: number, height: number, startY?: number) => {
// All hearts start based on global direction
const yPos = startY !== undefined ? startY : 
(globalDirection === 1 ? -60 - Math.random() * 40 : height + 60 + Math.random() * 40);

heartsParticlesRef.current.push({
x: Math.random() * width,
y: yPos,
speed: 0.65 + Math.random() * 0.55, // slower, calmer
rotation: Math.random() * Math.PI * 2,
rotationSpeed: (Math.random() - 0.5) * 0.02,
size: 60 + Math.random() * 50,
drift: (Math.random() - 0.5) * 0.25,
opacity: 0.5 + Math.random() * 0.35,
glow: 0.25,
direction: globalDirection, // All hearts use global direction
});
};

// Initialize screen with hearts at various positions for seamless start
const initializeHearts = (width: number, height: number) => {
heartsParticlesRef.current = [];
globalDirection = 1; // Start with all going down
lastDirectionChange = Date.now(); // Initialize direction change timer

// Pre-populate screen with hearts distributed across the height
const averageSpeed = 1.0; // Slower
const timeToCross = height / averageSpeed;
const heartsNeeded = Math.max(8, Math.ceil(timeToCross / 35));

// Fill the entire screen height with hearts, all moving in same direction
for (let i = 0; i < heartsNeeded + 6; i++) {
const yPos = (i / (heartsNeeded + 6)) * (height + 120) - 60;
spawnHeart(width, height, yPos);
}
};

// Draw elevated glassmorphic deep red heart
const drawGlassmorphicHeart = (x: number, y: number, size: number, rotation: number, opacity: number, glow: number) => {
if (!ctx) return;

ctx.save();
ctx.translate(x, y);
ctx.rotate(rotation);

const heartSize = size;
const scale = heartSize / 100; // Normalize to 100px base size
const halfSize = heartSize / 2;

// Create proper heart shape using mathematical heart curve
ctx.beginPath();

// Draw heart using parametric equation: x = 16sin??(t), y = -(13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t))
const steps = 60;
for (let i = 0; i <= steps; i++) {
const t = (i / steps) * Math.PI * 2;
// Heart parametric equations (scaled and centered)
const heartX = 16 * Math.pow(Math.sin(t), 3) * scale;
const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;

if (i === 0) {
ctx.moveTo(heartX, heartY);
} else {
ctx.lineTo(heartX, heartY);
}
}

ctx.closePath();

// Light pink glassmorphic base
const baseGradient = ctx.createRadialGradient(0, -halfSize * 0.15, 0, 0, 0, heartSize * 0.9);
baseGradient.addColorStop(0, `rgba(255, 204, 214, ${opacity * 0.9})`);   // Soft blush center
baseGradient.addColorStop(0.35, `rgba(255, 182, 193, ${opacity * 0.8})`); // Light pink
baseGradient.addColorStop(0.7, `rgba(255, 173, 188, ${opacity * 0.6})`);  // Rosy edge
baseGradient.addColorStop(1, `rgba(255, 182, 193, ${opacity * 0.35})`);   // Gentle falloff
ctx.fillStyle = baseGradient;
ctx.fill();

// Glassmorphic highlight layer (elevated glass effect)
ctx.globalCompositeOperation = 'overlay';
const highlightGradient = ctx.createRadialGradient(-halfSize * 0.3, -halfSize * 0.4, 0, 0, 0, heartSize * 0.7);
highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.35})`); // Bright white highlight
highlightGradient.addColorStop(0.4, `rgba(255, 225, 235, ${opacity * 0.22})`); // Soft pastel
highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
ctx.fillStyle = highlightGradient;
ctx.fill();
ctx.globalCompositeOperation = 'source-over';

// Subtle inner glow (elevated depth) - no weird circles
const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, heartSize * 0.4);
innerGlow.addColorStop(0, `rgba(255, 192, 203, ${opacity * 0.28})`);
innerGlow.addColorStop(1, 'rgba(255, 192, 203, 0)');
ctx.fillStyle = innerGlow;
ctx.fill();

// Elegant glass border (not cartoonish)
ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.45})`;
ctx.lineWidth = 1.1;
ctx.stroke();

// Subtle outer edge highlight
ctx.strokeStyle = `rgba(255, 225, 235, ${opacity * 0.25})`;
ctx.lineWidth = 0.8;
ctx.stroke();

ctx.restore();
};

// Animation loop
const animate = () => {
if (!active || !ready || selectedPack !== "hearts-overlay" || !ctx) {
return;
}

// Update canvas size if needed
const rect = container.getBoundingClientRect();
const currentWidth = rect.width;
const currentHeight = rect.height;

if (currentWidth !== displayWidth || currentHeight !== displayHeight) {
if (updateCanvasSize()) {
// Reinitialize particles with new dimensions
initializeHearts(displayWidth, displayHeight);
lastHeartSpawnTimeRef.current = Date.now();
}
}

if (displayWidth === 0 || displayHeight === 0) {
heartsAnimationFrameRef.current = requestAnimationFrame(animate);
return;
}

const now = Date.now();

// Spawn occasionally to maintain light density
if (now - lastHeartSpawnTimeRef.current > 1000 + Math.random() * 500) {
spawnHeart(displayWidth, displayHeight);
lastHeartSpawnTimeRef.current = now;
}

// Clear canvas and set DPR transform (no compounding)
clearAndSetDpr(ctx, canvas, dpr);

// STANDARDIZED ORDER: 1) Background, 2) Masked Person, 3) Particles
drawHeartsBackground();
drawPersonShared(ctx, displayWidth, displayHeight);
// Mark canvas as drawn to hide video
if (!canvasHasDrawnRef.current) {
canvasHasDrawnRef.current = true;
setCanvasHasDrawn(true);
}
      // Audio handling - resume if suspended, start if not started
if (heartsAudioCtxRef.current && heartsAudioCtxRef.current.state === "suspended") {
heartsAudioCtxRef.current.resume().catch(() => {});
} else if (!heartsAudioCtxRef.current) {
startHeartsAudio();
}

// Check if hearts have reached boundary and need to reverse together
const timeSinceLastChange = now - lastDirectionChange;
const minTimeBetweenChanges = 500;

if (timeSinceLastChange > minTimeBetweenChanges) {
if (globalDirection === 1) {
// Moving down - check if most hearts have reached bottom
const heartsAtBottom = heartsParticlesRef.current.filter(p => p.y >= displayHeight - 20).length;
if (heartsAtBottom >= heartsParticlesRef.current.length * 0.7) {
globalDirection = -1;
lastDirectionChange = now;
}
} else {
// Moving up - check if most hearts have reached top
const heartsAtTop = heartsParticlesRef.current.filter(p => p.y <= 20).length;
if (heartsAtTop >= heartsParticlesRef.current.length * 0.7) {
globalDirection = 1;
lastDirectionChange = now;
}
}
}

// Update and draw particles - all use global direction
heartsParticlesRef.current = heartsParticlesRef.current.filter((particle) => {
// Update position - all hearts use global direction
particle.y += particle.speed * globalDirection;
particle.x += particle.drift;

// Update rotation (tumbling effect)
particle.rotation += particle.rotationSpeed;

// Update particle's direction to match global
particle.direction = globalDirection;

// Wrap particles that go too far off screen
if (globalDirection === 1 && particle.y > displayHeight + 80) {
particle.y = -60 - Math.random() * 40;
} else if (globalDirection === -1 && particle.y < -80) {
particle.y = displayHeight + 60 + Math.random() * 40;
}

// Calculate fade-out near boundaries for seamless transition
const fadeZone = 60;
let finalOpacity = particle.opacity;

if (globalDirection === 1) {
if (particle.y > displayHeight - fadeZone) {
const fadeProgress = (particle.y - (displayHeight - fadeZone)) / fadeZone;
finalOpacity = particle.opacity * (1 - Math.min(fadeProgress, 1) * 0.4);
}
} else {
if (particle.y < fadeZone) {
const fadeProgress = (fadeZone - particle.y) / fadeZone;
finalOpacity = particle.opacity * (1 - Math.min(fadeProgress, 1) * 0.4);
}
}

// Draw heart with adjusted opacity
drawGlassmorphicHeart(
particle.x,
particle.y,
particle.size,
particle.rotation,
finalOpacity,
particle.glow * (finalOpacity / particle.opacity)
);

return true;
});

heartsAnimationFrameRef.current = requestAnimationFrame(animate);
};

// Initialize
requestAnimationFrame(() => {
const rect = container.getBoundingClientRect();
const currentDisplayWidth = rect.width;
const currentDisplayHeight = rect.height;

if (currentDisplayWidth === 0 || currentDisplayHeight === 0) {
setTimeout(() => {
const retryRect = container.getBoundingClientRect();
if (retryRect.width > 0 && retryRect.height > 0) {
if (updateCanvasSize()) {
initializeHearts(displayWidth, displayHeight);
lastHeartSpawnTimeRef.current = Date.now();
startHeartsAudio();
heartsAnimationFrameRef.current = requestAnimationFrame(animate);
}
}
}, 100);
return;
}

if (updateCanvasSize()) {
initializeHearts(displayWidth, displayHeight);
startHeartsAudio();
lastHeartSpawnTimeRef.current = Date.now();
heartsAnimationFrameRef.current = requestAnimationFrame(animate);
}
});

const handleUserGesture = () => {
startHeartsAudio();
};
window.addEventListener("pointerdown", handleUserGesture, { once: true });

window.addEventListener('resize', updateCanvasSize);

return () => {
window.removeEventListener("pointerdown", handleUserGesture);
window.removeEventListener('resize', updateCanvasSize);
if (heartsAnimationFrameRef.current) {
cancelAnimationFrame(heartsAnimationFrameRef.current);
heartsAnimationFrameRef.current = null;
}
      heartsParticlesRef.current = [];
stopHeartsAudio();
};
}, [active, ready, selectedPack]);

// Coins overlay animation - Only when coins scene is selected
useEffect(() => {
if (!active || !ready || selectedPack !== "coins-overlay") {
// Clean up animation
if (coinsAnimationFrameRef.current) {
cancelAnimationFrame(coinsAnimationFrameRef.current);
coinsAnimationFrameRef.current = null;
}
coinsParticlesRef.current = [];
stopCoinsAudio();
// Clear canvas if it exists and no other overlay is active
if (selectedPack !== "money-overlay") {
const canvas = overlayCanvasRef.current;
if (canvas) {
const ctx = canvas.getContext('2d');
if (ctx) {
ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}
}
return;
}

// Ensure segmentation is ready for masking
// Only try to initialize if it hasn't failed before
if (!segmentationFailedRef.current) {
  ensureSegmentationShared();
  runSegmentationShared();
}

// Preload coins background
if (!coinsBgImageRef.current) {
const img = new Image();
img.src = coinsBgCssUrl;
img.onload = () => { coinsBgReadyRef.current = true; };
img.onerror = () => { coinsBgReadyRef.current = false; };
coinsBgImageRef.current = img;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;

const container = canvas.parentElement;
if (!container) return;

let ctx: CanvasRenderingContext2D | null = null;
let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;

// Set canvas size to match container with device pixel ratio
const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;

if (displayWidth === 0 || displayHeight === 0) {
return false;
}

// Set actual size in memory (scaled for device pixel ratio)
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;

// Set display size (CSS pixels)
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';

// Set DPR transform (only place where we set it on resize)
ctx = canvas.getContext('2d');
if (ctx) {
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

return true;
};

const drawCoinsBackground = () => {
if (!ctx) return;
if (coinsBgReadyRef.current && coinsBgImageRef.current) {
const img = coinsBgImageRef.current;
const iw = img.naturalWidth;
const ih = img.naturalHeight;
if (iw && ih) {
const scale = Math.max(displayWidth / iw, displayHeight / ih);
const sw = iw * scale;
const sh = ih * scale;
const dx = (displayWidth - sw) / 2;
const dy = (displayHeight - sh) / 2;
ctx.drawImage(img, dx, dy, sw, sh);
return;
}
}
// fallback gradient
const grad = ctx.createLinearGradient(0, 0, 0, displayHeight);
grad.addColorStop(0, "rgba(255, 220, 230, 0.9)");
grad.addColorStop(1, "rgba(255, 200, 215, 0.8)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, displayWidth, displayHeight);
};

// Spawn a single glassmorphic coin (all coins use global direction)
// Initialize screen with coins falling like rain
const initializeCoins = (width: number, height: number) => {
coinsParticlesRef.current = [];

// Pre-populate screen with coins at various heights
const coinCount = 40;
for (let i = 0; i < coinCount; i++) {
coinsParticlesRef.current.push({
x: Math.random() * width,
y: Math.random() * height,
speed: 1.5 + Math.random() * 1.5, // Falling speed
rotation: Math.random() * Math.PI * 2,
rotationSpeed: 0.03 + Math.random() * 0.04, // Slow tumbling
tilt: Math.random() * Math.PI, // 0 = flat (face), PI/2 = edge, PI = flat (other side)
tiltSpeed: 0.02 + Math.random() * 0.03, // How fast it tilts
size: 8 + Math.random() * 6, // Very small coins
opacity: 0.7 + Math.random() * 0.2,
glow: 0.15,
});
}
};

// Draw hyperrealistic reflective gold coin with angle variation
const drawGoldCoin = (x: number, y: number, size: number, rotation: number, tilt: number, opacity: number, glow: number) => {
if (!ctx) return;

ctx.save();
ctx.translate(x, y);
ctx.rotate(rotation);

const radius = size / 2;
const normalizedTilt = tilt % Math.PI; // Keep between 0 and PI
const tiltRatio = Math.abs(Math.cos(normalizedTilt)); // 1 when flat, 0 when on edge

// When coin is on edge (tiltRatio close to 0), draw as thin line
if (tiltRatio < 0.15) {
// Coin is on edge - draw as thin gold line
const edgeThickness = Math.max(1, radius * 0.15);
const edgeWidth = radius * 2;

// Edge glow
if (glow > 0) {
ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3 * opacity})`;
ctx.fillRect(-edgeWidth / 2 - 2, -edgeThickness / 2 - 1, edgeWidth + 4, edgeThickness + 2);
}

// Gold edge
const edgeGradient = ctx.createLinearGradient(-edgeWidth / 2, 0, edgeWidth / 2, 0);
edgeGradient.addColorStop(0, `rgba(184, 134, 11, ${opacity})`);
edgeGradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity})`);
edgeGradient.addColorStop(1, `rgba(184, 134, 11, ${opacity})`);
ctx.fillStyle = edgeGradient;
ctx.fillRect(-edgeWidth / 2, -edgeThickness / 2, edgeWidth, edgeThickness);

// Edge highlight
ctx.fillStyle = `rgba(255, 255, 240, ${opacity * 0.6})`;
ctx.fillRect(-edgeWidth / 2, -edgeThickness / 2, edgeWidth, edgeThickness * 0.3);
} else {
// Coin is tilted or flat - draw as ellipse
const ellipseWidth = radius * 2 * tiltRatio;
const ellipseHeight = radius * 2;
const scaleX = tiltRatio;

// Outer glow
if (glow > 0) {
const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glow * 0.4 * opacity * tiltRatio})`);
glowGradient.addColorStop(0.5, `rgba(255, 200, 0, ${glow * 0.2 * opacity * tiltRatio})`);
glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
ctx.fillStyle = glowGradient;
ctx.beginPath();
ctx.ellipse(0, 0, radius * 1.5 * scaleX, radius * 1.5, 0, 0, Math.PI * 2);
ctx.fill();
}

// Base gold ellipse - deep gold
const baseGradient = ctx.createRadialGradient(-radius * 0.3 * scaleX, -radius * 0.3, 0, 0, 0, radius);
baseGradient.addColorStop(0, `rgba(255, 220, 100, ${opacity})`);
baseGradient.addColorStop(0.3, `rgba(218, 165, 32, ${opacity})`);
baseGradient.addColorStop(0.6, `rgba(184, 134, 11, ${opacity})`);
baseGradient.addColorStop(1, `rgba(139, 115, 85, ${opacity})`);
ctx.fillStyle = baseGradient;
ctx.beginPath();
ctx.ellipse(0, 0, ellipseWidth / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
ctx.fill();

// Reflective highlight - only visible when tilted
if (tiltRatio > 0.3) {
const highlightGradient = ctx.createRadialGradient(-radius * 0.4 * scaleX, -radius * 0.4, 0, -radius * 0.2 * scaleX, -radius * 0.2, radius * 0.6);
highlightGradient.addColorStop(0, `rgba(255, 255, 240, ${opacity * 0.9 * tiltRatio})`);
highlightGradient.addColorStop(0.4, `rgba(255, 240, 180, ${opacity * 0.6 * tiltRatio})`);
highlightGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
ctx.fillStyle = highlightGradient;
ctx.beginPath();
ctx.ellipse(-radius * 0.3 * scaleX, -radius * 0.3, radius * 0.7 * scaleX, radius * 0.7, 0, 0, Math.PI * 2);
ctx.fill();

// Secondary reflection
ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8 * tiltRatio})`;
ctx.beginPath();
ctx.ellipse(-radius * 0.35 * scaleX, -radius * 0.35, radius * 0.15 * scaleX, radius * 0.15, 0, 0, Math.PI * 2);
ctx.fill();
}

// Edge rim
const rimGradient = ctx.createLinearGradient(-ellipseWidth / 2, -ellipseHeight / 2, ellipseWidth / 2, ellipseHeight / 2);
rimGradient.addColorStop(0, `rgba(255, 215, 0, ${opacity * 0.8})`);
rimGradient.addColorStop(0.5, `rgba(184, 134, 11, ${opacity * 0.9})`);
rimGradient.addColorStop(1, `rgba(139, 115, 85, ${opacity * 0.8})`);
ctx.strokeStyle = rimGradient;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.ellipse(0, 0, ellipseWidth / 2 - 0.5, ellipseHeight / 2 - 0.5, 0, 0, Math.PI * 2);
ctx.stroke();

// Center design - only visible when showing face
if (tiltRatio > 0.5) {
ctx.fillStyle = `rgba(139, 115, 85, ${opacity * 0.9 * tiltRatio})`;
ctx.font = `bold ${size * 0.4 * tiltRatio}px Arial`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('$', 0, 0);

// Subtle texture - fine radial lines
ctx.strokeStyle = `rgba(184, 134, 11, ${opacity * 0.3 * tiltRatio})`;
ctx.lineWidth = 0.5;
for (let i = 0; i < 12; i++) {
const angle = (i / 12) * Math.PI * 2;
ctx.beginPath();
ctx.moveTo(Math.cos(angle) * radius * 0.6 * scaleX, Math.sin(angle) * radius * 0.6);
ctx.lineTo(Math.cos(angle) * radius * 0.9 * scaleX, Math.sin(angle) * radius * 0.9);
ctx.stroke();
}
}

// Shadow on bottom edge
const shadowGradient = ctx.createLinearGradient(0, -ellipseHeight / 2, 0, ellipseHeight / 2);
shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
shadowGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${opacity * 0.3})`);
ctx.fillStyle = shadowGradient;
ctx.beginPath();
ctx.ellipse(0, 0, ellipseWidth / 2, ellipseHeight / 2, 0, 0, Math.PI * 2);
ctx.fill();
}

ctx.restore();
};

// Single-frame draw function (no RAF - helper owns the loop)
const drawCoinsFrame = ({ width, height, ctx: frameCtx }: { width: number; height: number; ctx: CanvasRenderingContext2D }) => {
displayWidth = width;
displayHeight = height;
ctx = frameCtx;

const now = Date.now();

// Spawn new coins from top like rain
if (now - lastCoinSpawnTimeRef.current > 150 + Math.random() * 100) {
coinsParticlesRef.current.push({
x: Math.random() * displayWidth,
y: -20 - Math.random() * 30,
speed: 1.5 + Math.random() * 1.5,
rotation: Math.random() * Math.PI * 2,
rotationSpeed: 0.03 + Math.random() * 0.04,
tilt: Math.random() * Math.PI,
tiltSpeed: 0.02 + Math.random() * 0.03,
size: 8 + Math.random() * 6,
opacity: 0.7 + Math.random() * 0.2,
glow: 0.15,
});
lastCoinSpawnTimeRef.current = now;
}

// STANDARDIZED ORDER: 1) Background, 2) Masked Person, 3) Particles
drawCoinsBackground();
drawPersonShared(frameCtx, displayWidth, displayHeight);
// Mark canvas as drawn to hide video
if (!canvasHasDrawnRef.current) {
canvasHasDrawnRef.current = true;
setCanvasHasDrawn(true);
}

// Audio handling
if (coinsAudioCtxRef.current && coinsAudioCtxRef.current.state === "suspended") {
coinsAudioCtxRef.current.resume().catch(() => {});
} else if (!coinsAudioCtxRef.current) {
startCoinsAudio();
}

// Update and draw particles - falling like rain
coinsParticlesRef.current = coinsParticlesRef.current.filter((particle) => {
particle.y += particle.speed;
particle.x += (Math.random() - 0.5) * 0.3;
particle.rotation += particle.rotationSpeed;
particle.tilt += particle.tiltSpeed;

if (particle.y > displayHeight + 50) {
particle.y = -20 - Math.random() * 30;
particle.x = Math.random() * displayWidth;
particle.tilt = Math.random() * Math.PI;
}

if (particle.x < -50) particle.x = displayWidth + 50;
if (particle.x > displayWidth + 50) particle.x = -50;

drawGoldCoin(
particle.x,
particle.y,
particle.size,
particle.rotation,
particle.tilt,
particle.opacity,
particle.glow
);

return true;
});
};

return bootstrapCanvasOverlay({
enabled: active && ready && selectedPack === "coins-overlay",
canvasRef: overlayCanvasRef,
rafRef: coinsAnimationFrameRef,

onInit: ({ width, height }) => {
initializeCoins(width, height);
lastCoinSpawnTimeRef.current = Date.now();
},

onFrame: drawCoinsFrame,

onStartAudio: startCoinsAudio,
onStopAudio: stopCoinsAudio,

onCleanup: () => {
coinsParticlesRef.current = [];
},
});
}, [active, ready, selectedPack]);

// Gold sparks overlay animation - Only when gold sparks overlay pack is selected
useEffect(() => {
if (!active || !ready || selectedPack !== "gold-sparks-overlay") {
// Clean up animation
if (goldSparksAnimationFrameRef.current) {
cancelAnimationFrame(goldSparksAnimationFrameRef.current);
goldSparksAnimationFrameRef.current = null;
}
goldSparksParticlesRef.current = [];
stopGoldAudio();
return;
}

// Initialize segmentation for masking
// Only try to initialize if it hasn't failed before
if (!segmentationFailedRef.current) {
  ensureSegmentationShared();
  runSegmentationShared();
}

// Preload gold/grass background (STANDARDIZED: same as Hearts/Coins)
if (!goldBgImageRef.current) {
const img = new Image();
img.src = grassBgCssUrl;
img.onload = () => { goldBgReadyRef.current = true; };
img.onerror = () => { goldBgReadyRef.current = false; };
goldBgImageRef.current = img;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;

const container = canvas.parentElement;
if (!container) return;

// Get context immediately
const ctx = canvas.getContext('2d');
if (!ctx) {
console.error('Failed to get canvas context');
return;
}

let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;

// Set canvas size to match container with device pixel ratio
const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;

if (displayWidth === 0 || displayHeight === 0) {
return false; // Container not sized yet
}

// Set actual size in memory (scaled for device pixel ratio)
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;

// Set display size (CSS pixels)
canvas.style.width = displayWidth + 'px';
canvas.style.height = displayHeight + 'px';

// Set DPR transform (only place where we set it on resize)
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

return true;
};

// Initialize gold sparks particles
const initParticles = (width: number, height: number) => {
goldSparksParticlesRef.current = [];
const particleCount = 100; // Many sparks for full coverage
for (let i = 0; i < particleCount; i++) {
goldSparksParticlesRef.current.push({
x: Math.random() * width,
y: Math.random() * height,
speed: 0.1 + Math.random() * 0.2, // Very slow drift
angle: Math.random() * Math.PI * 2,
size: 2 + Math.random() * 6, // Varying sizes (small to medium)
opacity: 0.4 + Math.random() * 0.6, // Varying opacity
twinkleSpeed: 0.02 + Math.random() * 0.05, // Twinkling speed
life: Math.random() * Math.PI * 2, // Random phase for twinkling
});
}
};

const drawGrassBackground = () => {
if (goldBgReadyRef.current && goldBgImageRef.current) {
const img = goldBgImageRef.current;
const iw = img.naturalWidth;
const ih = img.naturalHeight;
if (iw && ih) {
const scale = Math.max(displayWidth / iw, displayHeight / ih);
const sw = iw * scale;
const sh = ih * scale;
const dx = (displayWidth - sw) / 2;
const dy = (displayHeight - sh) / 2;
ctx.drawImage(img, dx, dy, sw, sh);
return;
}
}
const grad = ctx.createLinearGradient(0, 0, 0, displayHeight);
grad.addColorStop(0, "rgba(160,200,140,0.9)");
grad.addColorStop(1, "rgba(120,170,110,0.8)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, displayWidth, displayHeight);
};

// Draw four-pointed gold star (like reference image)
const drawSpark = (x: number, y: number, size: number, opacity: number, angle: number) => {
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);

// Draw four-pointed star
ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`; // Bright gold
ctx.strokeStyle = `rgba(255, 223, 0, ${opacity})`; // Light gold for rays
ctx.lineWidth = 0.5;

// Create star shape (four-pointed)
ctx.beginPath();

// Top point
ctx.moveTo(0, -size);

// Top-right ray
ctx.lineTo(size * 0.3, -size * 0.3);
ctx.lineTo(size, 0);
ctx.lineTo(size * 0.3, size * 0.3);

// Bottom point
ctx.lineTo(0, size);

// Bottom-left ray
ctx.lineTo(-size * 0.3, size * 0.3);
ctx.lineTo(-size, 0);
ctx.lineTo(-size * 0.3, -size * 0.3);

ctx.closePath();
ctx.fill();
ctx.stroke();

// Bright central point (core of the star)
ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`; // Brighter center
ctx.beginPath();
ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
ctx.fill();

// Add glow/halo around star
const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
glowGradient.addColorStop(0, `rgba(255, 215, 0, ${opacity * 0.3})`);
glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
ctx.fillStyle = glowGradient;
ctx.beginPath();
ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
ctx.fill();

ctx.restore();
};

// Single-frame draw function (no RAF - helper owns the loop)
const drawGoldFrame = ({ width, height, ctx: frameCtx }: { width: number; height: number; ctx: CanvasRenderingContext2D }) => {
displayWidth = width;
displayHeight = height;

const time = Date.now() * 0.001;

// STANDARDIZED ORDER: 1) Background, 2) Masked Person, 3) Particles
drawGrassBackground();
drawPersonShared(frameCtx, displayWidth, displayHeight);
// Mark canvas as drawn to hide video
if (!canvasHasDrawnRef.current) {
canvasHasDrawnRef.current = true;
setCanvasHasDrawn(true);
}

// Draw particles on top of everything
goldSparksParticlesRef.current.forEach((particle) => {
particle.x += Math.cos(particle.angle) * particle.speed;
particle.y += Math.sin(particle.angle) * particle.speed;
if (particle.x < 0) particle.x = displayWidth;
if (particle.x > displayWidth) particle.x = 0;
if (particle.y < 0) particle.y = displayHeight;
if (particle.y > displayHeight) particle.y = 0;
particle.life += particle.twinkleSpeed;
const twinkleOpacity = 0.3 + Math.sin(particle.life) * 0.4;
drawSpark(particle.x, particle.y, particle.size, twinkleOpacity * particle.opacity, particle.angle + time * 0.2);
});

if (goldAudioCtxRef.current && goldAudioCtxRef.current.state === "suspended") {
goldAudioCtxRef.current.resume().catch(() => {});
}
};

return bootstrapCanvasOverlay({
enabled: active && ready && selectedPack === "gold-sparks-overlay",
canvasRef: overlayCanvasRef,
rafRef: goldSparksAnimationFrameRef,

onInit: ({ width, height }) => {
initParticles(width, height);
},

onFrame: drawGoldFrame,

onStartAudio: startGoldAudio,
onStopAudio: stopGoldAudio,

onCleanup: () => {
goldSparksParticlesRef.current = [];
},
});
}, [active, ready, selectedPack]);

// Rain + Thunder overlay (rebuilt to mirror Summit Top: bg ? masked person ? rain)
useEffect(() => {
if (!active || !ready || selectedPack !== "rain-thunder-overlay") {
if (rainThunderAnimationFrameRef.current) {
cancelAnimationFrame(rainThunderAnimationFrameRef.current);
rainThunderAnimationFrameRef.current = null;
}
if (thunderTimeoutRef.current) {
clearTimeout(thunderTimeoutRef.current);
thunderTimeoutRef.current = null;
}
if (rainNoiseRef.current) {
try { rainNoiseRef.current.stop(); } catch {}
rainNoiseRef.current = null;
}
if (rainAudioCtxRef.current) {
rainAudioCtxRef.current.close().catch(() => {});
rainAudioCtxRef.current = null;
}
rainGainRef.current = null;
thunderGainRef.current = null;
rainParticlesRef.current = [];
const canvas = overlayCanvasRef.current;
if (canvas && selectedPack !== "money-overlay" && selectedPack !== "hearts-overlay" && selectedPack !== "gold-sparks-overlay" && selectedPack !== "summit-top") {
const ctx = canvas.getContext("2d");
if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
if (videoRef.current && originalVideoFilterRef.current !== null) {
videoRef.current.style.filter = originalVideoFilterRef.current;
}
const container = overlayCanvasRef.current?.parentElement;
if (container && originalContainerTransformRef.current !== null) {
container.style.transform = originalContainerTransformRef.current;
}
return;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;
const container = canvas.parentElement;
if (!container) return;

let ctx: CanvasRenderingContext2D | null = null;
let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;
let lastJitter = 0;
let lightningUntil = 0;
let lightningBolts: Array<{ points: Array<[number, number]>; alpha: number }> = [];
let rainBgImage: HTMLImageElement | null = null;
let rainBgReady = false;

if (videoRef.current && originalVideoFilterRef.current === null) {
originalVideoFilterRef.current = videoRef.current.style.filter;
}
if (videoRef.current) videoRef.current.style.filter = "";
if (container && originalContainerTransformRef.current === null) {
originalContainerTransformRef.current = container.style.transform;
}

const ensureRainBackground = () => {
if (rainBgImage) return;
const img = new Image();
img.crossOrigin = "anonymous";
img.onload = () => {
console.log("[Rain BG] loaded", img.src);
rainBgReady = true;
};
img.onerror = (e) => {
console.warn("[Rain BG] failed to load", rainBgCssUrl, e);
rainBgReady = false;
};
img.src = rainBgCssUrl;
rainBgImage = img;
};

const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;
if (!displayWidth || !displayHeight) return false;
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;
canvas.style.width = `${displayWidth}px`;
canvas.style.height = `${displayHeight}px`;
ctx = canvas.getContext("2d");
if (ctx) {
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
ctx.imageSmoothingEnabled = true;
// @ts-ignore
ctx.imageSmoothingQuality = "high";
}
return true;
};

const drawBackground = () => {
// Draw rainforest background onto canvas (standardized approach)
if (rainBgReady && rainBgImage && rainBgImage.complete && rainBgImage.naturalWidth > 0) {
const iw = rainBgImage.naturalWidth;
const ih = rainBgImage.naturalHeight;
const scale = Math.max(displayWidth / iw, displayHeight / ih);
const sw = iw * scale;
const sh = ih * scale;
const dx = (displayWidth - sw) / 2;
const dy = (displayHeight - sh) / 2;
ctx.drawImage(rainBgImage, dx, dy, sw, sh);
} else {
// Fallback: dark rainy gradient
const grad = ctx.createLinearGradient(0, 0, 0, displayHeight);
grad.addColorStop(0, "rgba(30, 40, 50, 0.95)");
grad.addColorStop(1, "rgba(20, 30, 40, 0.9)");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, displayWidth, displayHeight);
}
};

const initRain = (targetCount: number) => {
rainParticlesRef.current = [];
for (let i = 0; i < targetCount; i++) {
rainParticlesRef.current.push({
x: Math.random() * displayWidth,
y: Math.random() * displayHeight,
speed: 6 + Math.random() * 6,
length: 14 + Math.random() * 18,
drift: (Math.random() - 0.5) * 0.6,
opacity: 0.35 + Math.random() * 0.25,
});
}
};

const maintainRain = (targetCount: number) => {
if (rainParticlesRef.current.length < targetCount) {
const deficit = targetCount - rainParticlesRef.current.length;
for (let i = 0; i < deficit; i++) {
rainParticlesRef.current.push({
x: Math.random() * displayWidth,
y: Math.random() * displayHeight,
speed: 6 + Math.random() * 6,
length: 14 + Math.random() * 18,
drift: (Math.random() - 0.5) * 0.6,
opacity: 0.35 + Math.random() * 0.25,
});
}
}
};

const drawStorm = () => {
if (!ctx) return;
const now = performance.now();
if (now < lightningUntil) {
ctx.save();
const flashAlpha = 0.05 + 0.05 * Math.random(); // softer flash to avoid UI wash-out
ctx.fillStyle = `rgba(210, 235, 255, ${flashAlpha})`;
ctx.fillRect(0, 0, displayWidth, displayHeight);
ctx.strokeStyle = `rgba(235, 245, 255, 0.6)`;
ctx.lineWidth = 2.2;
ctx.shadowColor = "rgba(200, 230, 255, 0.6)";
ctx.shadowBlur = 10;
for (const bolt of lightningBolts) {
ctx.globalAlpha = bolt.alpha * 0.8;
ctx.beginPath();
for (let i = 0; i < bolt.points.length; i++) {
const [bx, by] = bolt.points[i];
if (i === 0) ctx.moveTo(bx, by);
else ctx.lineTo(bx, by);
}
ctx.stroke();
}
ctx.restore();
}
ctx.save();
ctx.strokeStyle = "rgba(190, 210, 255, 0.5)";
ctx.lineWidth = 1.2;
for (const drop of rainParticlesRef.current) {
ctx.globalAlpha = drop.opacity;
ctx.beginPath();
ctx.moveTo(drop.x, drop.y);
ctx.lineTo(drop.x + drop.drift, drop.y + drop.length);
ctx.stroke();
drop.x += drop.drift * 0.6;
drop.y += drop.speed;
if (drop.y > displayHeight + 20) {
drop.y = -16;
drop.x = Math.random() * displayWidth;
}
if (drop.x < -20) drop.x = displayWidth + 10;
if (drop.x > displayWidth + 20) drop.x = -10;
}
ctx.restore();
};

const startAudio = () => {
if (rainAudioCtxRef.current) return;
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") audioCtx.resume(); } catch {}
const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32;
const rainNoise = audioCtx.createBufferSource();
rainNoise.buffer = buffer;
rainNoise.loop = true;
const rainFilter = audioCtx.createBiquadFilter();
rainFilter.type = "lowpass";
rainFilter.frequency.value = 1400;
const rainGain = audioCtx.createGain();
rainGain.gain.value = 0.14;
const thunderNoise = audioCtx.createBufferSource();
thunderNoise.buffer = buffer;
thunderNoise.loop = true;
const thunderFilter = audioCtx.createBiquadFilter();
thunderFilter.type = "lowpass";
thunderFilter.frequency.value = 260;
const thunderGain = audioCtx.createGain();
thunderGain.gain.value = 0.0;
rainNoise.connect(rainFilter);
rainFilter.connect(rainGain);
rainGain.connect(audioCtx.destination);
thunderNoise.connect(thunderFilter);
thunderFilter.connect(thunderGain);
thunderGain.connect(audioCtx.destination);
rainNoise.start();
thunderNoise.start();
rainAudioCtxRef.current = audioCtx;
rainNoiseRef.current = rainNoise;
rainGainRef.current = rainGain;
thunderGainRef.current = thunderGain;
};

const triggerThunder = () => {
if (!thunderGainRef.current || !rainAudioCtxRef.current) return;
const ctxAudio = rainAudioCtxRef.current;
const g = thunderGainRef.current;
const now = ctxAudio.currentTime;
const base = 0.24 + Math.random() * 0.1;
g.gain.cancelScheduledValues(now);
g.gain.setValueAtTime(0.0, now);
g.gain.linearRampToValueAtTime(base, now + 0.08);
g.gain.exponentialRampToValueAtTime(0.0008, now + 2.1 + Math.random() * 0.7);
const vNow = performance.now();
lightningUntil = vNow + 240 + Math.random() * 240;
lightningBolts = [];
const boltCount = 1 + Math.floor(Math.random() * 2);
for (let b = 0; b < boltCount; b++) {
const startX = Math.random() * displayWidth;
const segments = 5 + Math.floor(Math.random() * 4);
const points: Array<[number, number]> = [[startX, -20]];
for (let s = 1; s <= segments; s++) {
const jitterX = (Math.random() - 0.5) * 36;
const y = (displayHeight / segments) * s + Math.random() * 16;
points.push([startX + jitterX, y]);
}
lightningBolts.push({ points, alpha: 0.9 });
}
};

const scheduleThunder = () => {
if (thunderTimeoutRef.current) {
clearTimeout(thunderTimeoutRef.current);
}
thunderTimeoutRef.current = window.setTimeout(() => {
triggerThunder();
scheduleThunder();
}, 3400 + Math.random() * 4200);
};

// Single-frame draw function (no RAF - helper owns the loop)
const drawRainFrame = ({ width, height, ctx: frameCtx }: { width: number; height: number; ctx: CanvasRenderingContext2D }) => {
displayWidth = width;
displayHeight = height;
ctx = frameCtx;

const targetRainCount = Math.max(260, Math.floor(displayWidth / 2.5));
maintainRain(targetRainCount);

// STANDARDIZED ORDER: 1) Background, 2) Masked Person, 3) Effects (rain/lightning)
drawBackground();
drawPersonShared(frameCtx, displayWidth, displayHeight);
drawStorm();
// Mark canvas as drawn to hide video
if (!canvasHasDrawnRef.current) {
canvasHasDrawnRef.current = true;
setCanvasHasDrawn(true);
}
};

// Pre-init setup (before bootstrap starts RAF loop)
ensureRainBackground();
// Only try to initialize if it hasn't failed before
if (!segmentationFailedRef.current) {
  ensureSegmentationShared();
  runSegmentationShared();
}
triggerThunder();
scheduleThunder();

// Segmentation interval is now handled by shared useEffect above

const cleanup = bootstrapCanvasOverlay({
enabled: active && ready && selectedPack === "rain-thunder-overlay",
canvasRef: overlayCanvasRef,
rafRef: rainThunderAnimationFrameRef,

onInit: ({ width }) => {
const targetRainCount = Math.max(260, Math.floor(width / 2.5));
initRain(targetRainCount);
},

onFrame: drawRainFrame,

onStartAudio: startAudio,

onCleanup: () => {
if (thunderTimeoutRef.current) {
clearTimeout(thunderTimeoutRef.current);
thunderTimeoutRef.current = null;
}
if (rainNoiseRef.current) {
try { rainNoiseRef.current.stop(); } catch {}
rainNoiseRef.current = null;
}
if (rainAudioCtxRef.current) {
rainAudioCtxRef.current.close().catch(() => {});
rainAudioCtxRef.current = null;
}
rainGainRef.current = null;
thunderGainRef.current = null;
rainParticlesRef.current = [];
maskHistoryRef.current = [];
if (videoRef.current && originalVideoFilterRef.current !== null) {
videoRef.current.style.filter = originalVideoFilterRef.current;
}
if (container && originalContainerTransformRef.current !== null) {
container.style.transform = originalContainerTransformRef.current;
}
},
});

return () => {
cleanup?.();
};
}, [active, ready, selectedPack]);

// Summit Top overlay: photo backdrop + continuous snow + wind
useEffect(() => {
if (!active || !ready || selectedPack !== "summit-top") {
if (summitAnimationFrameRef.current) {
cancelAnimationFrame(summitAnimationFrameRef.current);
summitAnimationFrameRef.current = null;
}
summitSnowRef.current = [];
if (summitWindSourceRef.current) {
try { summitWindSourceRef.current.stop(); } catch {}
summitWindSourceRef.current = null;
}
if (summitWindAudioCtxRef.current) {
summitWindAudioCtxRef.current.close().catch(() => {});
summitWindAudioCtxRef.current = null;
}
summitWindGainRef.current = null;
if (selectedPack !== "money-overlay" && selectedPack !== "hearts-overlay" && selectedPack !== "gold-sparks-overlay") {
const canvas = overlayCanvasRef.current;
if (canvas) {
const ctx = canvas.getContext("2d");
if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}
return;
}

const canvas = overlayCanvasRef.current;
if (!canvas) return;
const container = canvas.parentElement;
if (!container) return;

let ctx: CanvasRenderingContext2D | null = null;
let dpr = window.devicePixelRatio || 1;
let displayWidth = 0;
let displayHeight = 0;
let targetSnow = 0;

const ensureBackground = () => {
if (summitBgImageRef.current && summitBgImageRef.current.src) return;
const img = new Image();
img.crossOrigin = "anonymous";
const candidates = [
import.meta.env.VITE_SUMMIT_BG_URL,
"/summit-bg.jpg.png", // actual file present
"/summit-bg.jpg"
].filter(Boolean) as string[];
let idx = 0;
const tryNext = () => {
if (idx >= candidates.length) {
summitBgReadyRef.current = false;
console.warn("Summit Top background failed to load from all candidates:", candidates);
return;
}
const url = candidates[idx++];
img.src = url;
};
img.onload = () => {
summitBgReadyRef.current = true;
};
img.onerror = () => {
summitBgReadyRef.current = false;
tryNext();
};
summitBgImageRef.current = img;
tryNext();
};

const startWind = () => {
if (summitWindAudioCtxRef.current) return;
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
if (!AudioCtx) return;
const audioCtx = new AudioCtx();
try { if (audioCtx.state === "suspended") audioCtx.resume(); } catch {}
const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.loop = true;
const hp = audioCtx.createBiquadFilter();
hp.type = "highpass";
hp.frequency.value = 100;
const lp = audioCtx.createBiquadFilter();
lp.type = "lowpass";
lp.frequency.value = 1400;
const gain = audioCtx.createGain();
gain.gain.value = 0.06;
source.connect(hp);
hp.connect(lp);
lp.connect(gain);
gain.connect(audioCtx.destination);
source.start();
summitWindAudioCtxRef.current = audioCtx;
summitWindSourceRef.current = source;
summitWindGainRef.current = gain;
};

const updateCanvasSize = () => {
dpr = window.devicePixelRatio || 1; // Refresh DPR (can change without resize)
const rect = container.getBoundingClientRect();
displayWidth = rect.width;
displayHeight = rect.height;
if (!displayWidth || !displayHeight) return false;
canvas.width = displayWidth * dpr;
canvas.height = displayHeight * dpr;
canvas.style.width = `${displayWidth}px`;
canvas.style.height = `${displayHeight}px`;
ctx = canvas.getContext("2d");
if (ctx) {
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
// High quality scaling for cleaner mask/background
ctx.imageSmoothingEnabled = true;
// @ts-ignore
ctx.imageSmoothingQuality = "high";
}
return true;
};

const initSnow = () => {
targetSnow = Math.max(180, Math.floor(displayWidth / 4));
summitSnowRef.current = [];
for (let i = 0; i < targetSnow; i++) {
summitSnowRef.current.push({
x: Math.random() * displayWidth,
y: Math.random() * displayHeight,
speed: 0.8 + Math.random() * 1.8,
size: 1 + Math.random() * 2.6,
drift: (Math.random() - 0.5) * 0.55,
opacity: 0.3 + Math.random() * 0.45,
});
}
};

const drawBackground = () => {
if (!ctx) return;
const img = summitBgImageRef.current;
if (img && summitBgReadyRef.current && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
const iw = img.naturalWidth;
const ih = img.naturalHeight;
const scale = Math.max(displayWidth / iw, displayHeight / ih);
const sw = iw * scale;
const sh = ih * scale;
const dx = (displayWidth - sw) / 2;
const dy = (displayHeight - sh) / 2;
ctx.drawImage(img, dx, dy, sw, sh);
} else {
const sky = ctx.createLinearGradient(0, 0, 0, displayHeight);
sky.addColorStop(0, "rgba(25,35,60,0.8)");
sky.addColorStop(1, "rgba(200,210,220,0.7)");
ctx.fillStyle = sky;
ctx.fillRect(0, 0, displayWidth, displayHeight);
}
};

const drawSnow = () => {
if (!ctx) return;
ctx.save();
ctx.fillStyle = "rgba(255,255,255,0.9)";
summitSnowRef.current.forEach((flake) => {
ctx.globalAlpha = flake.opacity;
ctx.beginPath();
ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
ctx.fill();
flake.x += flake.drift;
flake.y += flake.speed;
if (flake.y > displayHeight + 8) {
flake.y = -12;
flake.x = Math.random() * displayWidth;
}
if (flake.x < -16) flake.x = displayWidth + 8;
if (flake.x > displayWidth + 16) flake.x = -8;
});
ctx.restore();
};

const maintainSnow = () => {
if (summitSnowRef.current.length < targetSnow) {
const deficit = targetSnow - summitSnowRef.current.length;
for (let i = 0; i < deficit; i++) {
summitSnowRef.current.push({
x: Math.random() * displayWidth,
y: Math.random() * displayHeight,
speed: 0.8 + Math.random() * 1.8,
size: 1 + Math.random() * 2.6,
drift: (Math.random() - 0.5) * 0.55,
opacity: 0.3 + Math.random() * 0.45,
});
}
}
};

// Single-frame draw function (no RAF - helper owns the loop)
const drawSummitFrame = ({ width, height, ctx: frameCtx }: { width: number; height: number; ctx: CanvasRenderingContext2D }) => {
displayWidth = width;
displayHeight = height;
ctx = frameCtx;

// STANDARDIZED ORDER: 1) Background, 2) Masked Person, 3) Effects (snow)
drawBackground();
drawPersonShared(frameCtx, displayWidth, displayHeight);
drawSnow();
maintainSnow();
// Mark canvas as drawn to hide video
if (!canvasHasDrawnRef.current) {
canvasHasDrawnRef.current = true;
setCanvasHasDrawn(true);
}
};

// Pre-init setup (before bootstrap starts RAF loop)
ensureBackground();
// Only try to initialize if it hasn't failed before
if (!segmentationFailedRef.current) {
  ensureSegmentationShared();
  runSegmentationShared();
}

// Segmentation interval is now handled by shared useEffect above

const cleanup = bootstrapCanvasOverlay({
enabled: active && ready && selectedPack === "summit-top",
canvasRef: overlayCanvasRef,
rafRef: summitAnimationFrameRef,

onInit: ({ width }) => {
targetSnow = Math.max(180, Math.floor(width / 4));
initSnow();
},

onFrame: drawSummitFrame,

onStartAudio: startWind,

onCleanup: () => {
if (summitWindSourceRef.current) {
try { summitWindSourceRef.current.stop(); } catch {}
summitWindSourceRef.current = null;
}
if (summitWindAudioCtxRef.current) {
summitWindAudioCtxRef.current.close().catch(() => {});
summitWindAudioCtxRef.current = null;
}
summitWindGainRef.current = null;
summitSnowRef.current = [];
maskHistoryRef.current = [];
},
});

return () => {
cleanup?.();
};
}, [active, ready, selectedPack]);

// Shared segmentation interval for all canvas scenes
const usingCanvasScene =
  active &&
  ready &&
  (selectedPack === "hearts-overlay" ||
    selectedPack === "coins-overlay" ||
    selectedPack === "gold-sparks-overlay" ||
    selectedPack === "rain-thunder-overlay" ||
    selectedPack === "summit-top");

useEffect(() => {
  if (!usingCanvasScene) return;

  // Only try to initialize if it hasn't failed before
  // Don't reset the failure flag - if segmentation failed, it should stay failed
  if (!segmentationFailedRef.current) {
    ensureSegmentationShared();
  }

  // run once immediately (helps first-frame)
  runSegmentationShared();

  // Use longer interval on mobile for stability (600ms vs 100ms on desktop)
  const segInterval = isMobile ? 600 : 100;
  const id = window.setInterval(() => {
    runSegmentationShared();
  }, segInterval);

  return () => window.clearInterval(id);
}, [usingCanvasScene, selectedPack, ensureSegmentationShared, runSegmentationShared]);

// Load affirmation sets from database (cloud-first)
useEffect(() => {
const loadAffirmationSets = async () => {
// Always start with premade sets
let allSets = [...getLocalizedPremadeSets()];

// Only try to load user sets if we have a user from AuthContext
if (!user) {
  setAffirmationSets(allSets);
  return;
}

try {
  // Try to load user sets from database - RLS will automatically filter by auth.uid() = user_id
  // If session is invalid, RLS will return empty/error, which we handle gracefully
  const { data: dbSets, error: dbError } = await supabase
    .from('user_affirmation_sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error("Error loading from database:", dbError);
    // Fall back to premade sets only if database query fails
    setAffirmationSets(allSets);
    return;
  }

  if (dbSets && dbSets.length > 0) {
    // Convert database sets to AffirmationSet format
    const userSets: AffirmationSet[] = dbSets.map(dbSet => ({
      id: dbSet.id,
      name: dbSet.name,
      affirmations: dbSet.affirmations as string[],
      images: dbSet.images as any[],
      isPremade: false,
      category: dbSet.category || undefined,
    }));
    allSets = [...getLocalizedPremadeSets(), ...userSets];
  }
} catch (error) {
  console.error("Error loading from database:", error);
  // Fall back to premade sets on any error
}

setAffirmationSets(allSets);
};

loadAffirmationSets();
}, [user, selectedSetId]);

// Cycle through affirmations when active
useEffect(() => {
if (!active || !selectedSetId) {
setCurrentAffirmation("");
return;
}

const selectedSet = affirmationSets.find(s => s.id === selectedSetId);
if (!selectedSet || selectedSet.affirmations.length === 0) {
setCurrentAffirmation("");
return;
}

let index = 0;
setCurrentAffirmation(selectedSet.affirmations[0]);

const interval = setInterval(() => {
index = (index + 1) % selectedSet.affirmations.length;
setCurrentAffirmation(selectedSet.affirmations[index]);
}, intervalMs);

return () => clearInterval(interval);
}, [active, selectedSetId, affirmationSets, intervalMs]);

// Basic SEO for this route
useEffect(() => {
const prevTitle = document.title;
// Simple tab title
document.title = t("mirror.pageTitle");

const ensureMeta = (name: string, content: string) => {
let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
if (!tag) {
tag = document.createElement("meta");
tag.name = name;
document.head.appendChild(tag);
}
tag.content = content;
};

ensureMeta("description", t("mirror.metaDescriptionWeb"));

// Canonical
let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
if (!link) {
link = document.createElement("link");
link.rel = "canonical";
document.head.appendChild(link);
}
link.href = window.location.origin + "/dashboard/mirror";

return () => {
document.title = prevTitle;
};
}, [t]);

const stopCamera = useCallback(() => {
setReady(false);
setActive(false);
setConfidence(0);
setFeedbackMessage(null);
setMaskReady(false); // Reset mask state for next session
canvasHasDrawnRef.current = false; // Reset canvas drawn state
setCanvasHasDrawn(false);
lastFeedbackTimeRef.current = 0;
lastMeterUpdateRef.current = 0;
volumeHistoryRef.current = []; // Reset volume history
initializationSamplesRef.current = 0; // Reset initialization counter

// Reset segmentation / mask state so next run starts clean
summitMaskReadyRef.current = false;
summitSegMaskRef.current = null;
maskHistoryRef.current = [];
// Reset failure state to allow retry (fixes "once failed, always failed")
segmentationFailedRef.current = false;

if (detectionIntervalRef.current) {
clearInterval(detectionIntervalRef.current);
detectionIntervalRef.current = null;
}

// Cleanup audio context
if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
audioContextRef.current.close();
audioContextRef.current = null;
analyserRef.current = null;
dataArrayRef.current = null;
}

if (streamRef.current) {
streamRef.current.getTracks().forEach((t) => t.stop());
streamRef.current = null;
}
if (videoRef.current) {
videoRef.current.srcObject = null;
}
}, []);

const startCamera = useCallback(async () => {
setError(null);

// Check if we're in a secure context (required for camera access)
if (!window.isSecureContext && location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
setError(i18n.t("mirror.errors.httpsRequired", { ns: "tools" }));
return;
}

// Get getUserMedia function with fallbacks for different browsers
const getUserMedia = 
navigator.mediaDevices?.getUserMedia ||
(navigator as any).getUserMedia ||
(navigator as any).webkitGetUserMedia ||
(navigator as any).mozGetUserMedia ||
(navigator as any).msGetUserMedia;

if (!getUserMedia) {
setError(i18n.t("mirror.errors.notSupported", { ns: "tools" }));
return;
}

// Check permissions on iOS/Safari (optional check, don't block if it fails)
if (navigator.permissions && navigator.permissions.query) {
try {
const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
if (permissionStatus.state === 'denied') {
setError(i18n.t("mirror.errors.permissionDeniedSafari", { ns: "tools" }));
return;
}
} catch (e) {
// Permissions API might not support 'camera' on all browsers, continue anyway
console.log("Permissions API check not available, proceeding with getUserMedia");
}
}

try {
// Request camera and microphone access - this will trigger the permission prompt on iPhone
const constraints = {
video: { 
facingMode: "user",
width: { ideal: 1280 },
height: { ideal: 720 }
},
audio: true,
};

// Use the appropriate API
let stream: MediaStream;
if (navigator.mediaDevices?.getUserMedia) {
stream = await navigator.mediaDevices.getUserMedia(constraints);
} else {
// Fallback for older browsers
stream = await new Promise<MediaStream>((resolve, reject) => {
getUserMedia.call(navigator, constraints, resolve, reject);
});
}

streamRef.current = stream;

if (videoRef.current) {
const video = videoRef.current;
// Ensure attributes for autoplay in iOS/Safari/Chrome inside iframes
video.muted = true;
video.autoplay = true;
video.playsInline = true;
video.setAttribute("muted", "");
video.setAttribute("playsinline", "");

// Attach stream and confirm we have a video track
if (stream.getVideoTracks().length === 0) {
console.error("[Mirror] No video tracks in stream");
setError(i18n.t("mirror.errors.noVideoTrack", { ns: "tools" }));
return;
}
video.srcObject = stream;

const markReady = () => {
setReady(true);
// Reset feedback timer so first feedback appears after 7 seconds
lastFeedbackTimeRef.current = Date.now();
};

const onLoadedMetadata = () => {
console.log("[Mirror] loadedmetadata", { w: video.videoWidth, h: video.videoHeight });
video.play().then(() => {
console.log("[Mirror] video.play() resolved");
markReady();
}).catch((err) => {
console.warn("[Mirror] video.play() error", err);
});
cleanup();
};
const onPlaying = () => {
console.log("[Mirror] playing");
markReady();
cleanup();
};
const onCanPlay = () => {
console.log("[Mirror] canplay");
markReady();
cleanup();
};

const cleanup = () => {
video.removeEventListener("loadedmetadata", onLoadedMetadata);
video.removeEventListener("playing", onPlaying);
video.removeEventListener("canplay", onCanPlay);
};

video.addEventListener("loadedmetadata", onLoadedMetadata);
video.addEventListener("playing", onPlaying);
video.addEventListener("canplay", onCanPlay);

// Fallback readiness check
window.setTimeout(() => {
if (!ready && video.videoWidth > 0) {
console.log("[Mirror] fallback ready");
markReady();
}
}, 1500);
}
setActive(true);
} catch (e: any) {
console.error("Camera access error:", e);
let message = i18n.t("mirror.errors.unableAccessAllow", { ns: "tools" });

if (e && e.name === "NotAllowedError") {
// iOS/Safari specific instructions
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
if (isIOS) {
message = i18n.t("mirror.errors.permissionDeniedIosSafari", { ns: "tools" });
} else {
message = i18n.t("mirror.errors.permissionDeniedBrowser", { ns: "tools" });
}
} else if (e && e.name === "NotFoundError") {
message = i18n.t("mirror.errors.noCameraFound", { ns: "tools" });
} else if (e && e.name === "NotReadableError") {
message = i18n.t("mirror.errors.cameraInUse", { ns: "tools" });
} else if (e && e.name === "SecurityError") {
message = i18n.t("mirror.errors.securityBlocked", { ns: "tools" });
} else if (e && e.name === "TypeError") {
message = i18n.t("mirror.errors.apiNotAvailable", { ns: "tools" });
} else if (e && e.name === "OverconstrainedError") {
// Try again with simpler constraints
try {
const getUserMedia = 
navigator.mediaDevices?.getUserMedia ||
(navigator as any).getUserMedia ||
(navigator as any).webkitGetUserMedia ||
(navigator as any).mozGetUserMedia ||
(navigator as any).msGetUserMedia;

let fallbackStream: MediaStream;
if (navigator.mediaDevices?.getUserMedia) {
fallbackStream = await navigator.mediaDevices.getUserMedia({
video: true,
audio: true,
});
} else {
fallbackStream = await new Promise<MediaStream>((resolve, reject) => {
getUserMedia.call(navigator, { video: true, audio: true }, resolve, reject);
});
}
streamRef.current = fallbackStream;
if (videoRef.current) {
const video = videoRef.current;
video.muted = true;
video.autoplay = true;
video.playsInline = true;
video.setAttribute("muted", "");
video.setAttribute("playsinline", "");
video.srcObject = fallbackStream;
video.play().then(() => {
setReady(true);
lastFeedbackTimeRef.current = Date.now();
}).catch((err) => {
console.warn("Video play error:", err);
});
}
setActive(true);
return;
} catch (fallbackError) {
message = i18n.t("mirror.errors.checkDeviceSettings", { ns: "tools" });
}
}

setError(message);
setActive(false);
}
}, []);

useEffect(() => {
return () => {
// Cleanup media on unmount only (avoid stopping camera during state updates)
if (streamRef.current) {
streamRef.current.getTracks().forEach((t) => t.stop());
streamRef.current = null;
}
if (videoRef.current) {
videoRef.current.srcObject = null;
}
};
}, []);

const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('sidebar-collapsed');
  return saved === 'true';
});

return (
<div
  className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-24 md:pb-8 safe-area-top")}
  style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
>
{/* Desktop Sidebar - Only on desktop */}
{!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

{/* Main Content - Offset for sidebar on desktop */}
<div 
  className="min-h-screen"
  style={!isMobile ? {
    marginLeft: sidebarCollapsed ? '64px' : '256px',
    transition: 'margin-left 300ms ease-in-out'
  } : {}}
>
{/* Safe area background - fixed at top */}
<div className={theme === "dark" ? "fixed top-0 left-0 right-0 z-40 bg-[#0f0d14]" : "fixed top-0 left-0 right-0 bg-white z-40"} style={{ height: "env(safe-area-inset-top, 0px)" }} />
{/* Header */}
<header 
  className={cn(
    "z-50 border-b md:h-16 flex items-center py-3 md:py-0",
    headerChrome.className,
    isMobile ? "sticky" : "fixed top-0 right-0"
  )} 
  style={isMobile ? { top: 'env(safe-area-inset-top, 0px)', ...headerChrome.style } : {
    top: 'env(safe-area-inset-top, 0px)',
    left: sidebarCollapsed ? '64px' : '256px',
    right: '0',
    transition: 'left 300ms ease-in-out',
    ...headerChrome.style,
  }}
>
<div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
<h1 
  className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
  onClick={() => navigate("/dashboard")}
>
{t("mirror.title")}
</h1>
{isMobile && <MobilePWAMenu />}
</div>
</header>

<main className={cn("px-4 sm:px-6 max-w-6xl", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
<div className="py-3 sm:py-4">
<p className={cn("text-sm sm:text-base", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
{t("mirror.subtitle")}
</p>
</div>

<Card className="overflow-hidden border border-border bg-white/50 backdrop-blur-sm dark:bg-white/50">
<div 
className="relative bg-black bg-cover bg-center"
style={{ 
aspectRatio: '9/16',
maxHeight: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true ? '68vh' : '75vh',
width: '100%',
minHeight: '50vh',
backgroundImage:
active && selectedPack === "hearts-overlay"
? `url(${heartsBgCssUrl})`
: active && selectedPack === "coins-overlay"
? `url(${coinsBgCssUrl})`
: active && selectedPack === "summit-top"
? `url(${summitBgCssUrl})`
: active && selectedPack === "rain-thunder-overlay"
? `url(${rainBgCssUrl})`
: active && selectedPack === "gold-sparks-overlay"
? `url(${grassBgCssUrl})`
: !active
? `url(${mirrorBackground})`
: undefined,
backgroundSize:
(active && (selectedPack === "hearts-overlay" || selectedPack === "coins-overlay")) ||
(active && selectedPack === "summit-top") ||
(active && selectedPack === "rain-thunder-overlay") ||
(active && selectedPack === "gold-sparks-overlay")
? "cover"
: undefined,
backgroundPosition:
(active && (selectedPack === "hearts-overlay" || selectedPack === "coins-overlay")) ||
(active && selectedPack === "summit-top") ||
(active && selectedPack === "rain-thunder-overlay") ||
(active && selectedPack === "gold-sparks-overlay")
? "center center"
: undefined,
backgroundRepeat:
(active && (selectedPack === "hearts-overlay" || selectedPack === "coins-overlay")) ||
(active && selectedPack === "summit-top") ||
(active && selectedPack === "rain-thunder-overlay") ||
(active && selectedPack === "gold-sparks-overlay")
? "no-repeat"
: undefined
}}
>
<video
ref={videoRef}
className="w-full h-full object-cover"
style={{ 
display: active ? 'block' : 'none',
transform: "scaleX(-1)",
opacity: (() => {
  // Hide video when using canvas scenes after canvas has drawn (prevents ghost outline)
  const usingCanvasScene = 
    selectedPack === "hearts-overlay" ||
    selectedPack === "coins-overlay" ||
    selectedPack === "gold-sparks-overlay" ||
    selectedPack === "rain-thunder-overlay" ||
    selectedPack === "summit-top";
  
  if (usingCanvasScene) {
    return canvasHasDrawn ? 0 : 1; // Show video only until canvas draws at least once
  }
  return 1;
})(),
imageRendering: 'auto',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden',
willChange: 'auto'
}}
autoPlay
muted
playsInline
/>

{!active && (
<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-black dark:text-black">
<Button 
size="lg" 
onClick={(e) => {
e.preventDefault();
e.stopPropagation();
resumeAllAudioContexts();
// Kick off audio for currently selected pack under the user gesture
if (selectedPack === "hearts-overlay") {
startHeartsAudio();
} else if (selectedPack === "coins-overlay") {
startCoinsAudio();
} else if (selectedPack === "gold-sparks-overlay") {
startGoldAudio();
} else if (selectedPack === "rain-thunder-overlay") {
startRainAudio();
} else if (selectedPack === "summit-top") {
startSummitWindAudio();
}
startCamera();
}}
className="bg-[hsl(0,0%,20%)] text-white hover:bg-[hsl(0,0%,25%)] dark:bg-[hsl(0,0%,20%)] dark:text-white dark:hover:bg-[hsl(0,0%,25%)]"
>
{t("mirror.seeYourself")}
</Button>
{error && (
<div className="text-center px-6 max-w-md">
<p className="text-sm text-red-600 dark:text-red-600 mb-2">{error}</p>
{/iPhone|iPad|iPod/.test(navigator.userAgent) && error.includes("permission") && (
<p className="text-xs text-gray-500 dark:text-gray-500">
{t("mirror.permissionHints.safari")}
</p>
)}
</div>
)}
</div>
)}

{active && !ready && (
<div className="absolute inset-0 grid place-items-center text-gray-600 dark:text-gray-600 text-sm">
{t("mirror.initializingCamera")}
</div>
)}

{/* Gradient overlay - stays at top */}
{active && currentAffirmation && (
<div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent h-[30%] z-30 pointer-events-none" />
)}

{/* Affirmation text - positioned separately */}
{active && currentAffirmation && (
<div className="absolute inset-x-0 top-[20%] p-6 z-30">
<p className="text-white text-xl sm:text-2xl md:text-3xl font-bold text-center animate-fade-in">
{currentAffirmation}
</p>
</div>
)}

{/* Overlay Canvas - For hearts/coins, gold sparks, rain/thunder, or summit top */}
{active && ready && (
selectedPack === "hearts-overlay" ||
selectedPack === "coins-overlay" ||
selectedPack === "gold-sparks-overlay" ||
selectedPack === "rain-thunder-overlay" ||
selectedPack === "summit-top"
) && (
<canvas
ref={overlayCanvasRef}
className="absolute inset-0 w-full h-full pointer-events-none z-10"
style={{ 
mixBlendMode: 'normal',
opacity: selectedPack === "summit-top"
? 1
: selectedPack === "rain-thunder-overlay"
? 1
: 1,
top: 0,
left: 0,
right: 0,
bottom: 0,
position: 'absolute',
imageRendering: 'auto',
backfaceVisibility: 'hidden',
WebkitBackfaceVisibility: 'hidden'
}}
/>
)}

{/* Confidence feedback overlay */}
{active && showMeter && hasMeterAccess && (
<div className="absolute bottom-20 right-4 flex flex-col items-end gap-2 z-40 pointer-events-none">
{/* Feedback message above meter */}
{feedbackMessage && (
<div className="bg-primary/90 backdrop-blur-sm rounded-lg px-4 py-2 max-w-xs pointer-events-auto">
<p className="text-primary-foreground text-sm text-center font-medium">
{feedbackMessage}
</p>
</div>
)}
{/* Meter always visible */}
<div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto">
<div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
<div 
className="h-full bg-white transition-all duration-300"
style={{ width: `${Math.max(confidence * 100, 1)}%` }}
/>
</div>
</div>
</div>
)}

{active && (
<div className="absolute bottom-4 right-4 z-40 pointer-events-auto">
<Button size="lg" variant="destructive" onClick={stopCamera}>
{t("mirror.stop")}
</Button>
</div>
)}

{/* Floating Settings Overlay - Show when not active */}
{!active && (
<div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-md border-t border-border p-4 space-y-3 dark:bg-white/90">
{/* Affirmation Set, Scenes, and Feedback - Side by Side */}
<div className="grid grid-cols-3 gap-4 sm:gap-6 items-start">
{/* Affirmation Set Selector */}
<div className="flex flex-col gap-2">
<label className="text-sm font-medium text-black dark:text-black whitespace-nowrap">{t("mirror.affirmationSet")}</label>
<Select
                  value={selectedSetId ?? ""}
onValueChange={(v) => setSelectedSetId(v || "")}
>
<SelectTrigger className="w-full h-10 bg-white/80 border-border dark:bg-white/80 text-black dark:text-black text-left [&>span]:line-clamp-none [&>span]:whitespace-nowrap [&>span]:overflow-hidden [&>span]:text-ellipsis">
<SelectValue placeholder={t("mirror.selectPlaceholder")} className="text-black dark:text-black text-left" />
</SelectTrigger>
<SelectContent className="bg-white z-50 dark:bg-white border-border text-black dark:text-black">
{affirmationSets.length === 0 ? (
<SelectItem value="none" disabled className="text-black dark:text-black">{t("mirror.noSetsAvailable")}</SelectItem>
) : (
<>
{affirmationSets.map(set => (
<SelectItem key={set.id} value={set.id} className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black">
{set.name} ({set.affirmations.length})
</SelectItem>
))}
</>
)}
</SelectContent>
</Select>
</div>

{/* Scenes Selector */}
<div className="flex flex-col gap-2">
<div className="flex items-center gap-2">
<label className="text-sm font-medium text-black dark:text-black">
{t("mirror.scenes")}
</label>
</div>
<Select 
                  value={selectedPack ?? ""} 
onValueChange={(value) => {
if (hasScenesAccess) {
setSelectedPack(value || "");
// Clear mask history when switching overlays, but keep existing mask
// for smooth transitions between scenes
maskHistoryRef.current = [];
}
}}
>
<SelectTrigger className={cn(
"w-full h-10 bg-white/80 border-border dark:bg-white/80 text-black dark:text-black text-left [&>span]:line-clamp-none [&>span]:whitespace-nowrap [&>span]:overflow-hidden [&>span]:text-ellipsis",
!hasScenesAccess && "opacity-50 cursor-not-allowed"
)}>
<SelectValue placeholder={t("mirror.selectPlaceholder")} className="text-black dark:text-black text-left" />
</SelectTrigger>
<SelectContent className="bg-white z-50 dark:bg-white border-border text-black dark:text-black">
<SelectItem 
value="none" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.none")}
</SelectItem>
<SelectItem 
value="hearts-overlay" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.hearts")}
</SelectItem>
<SelectItem 
value="coins-overlay" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.coins")}
</SelectItem>
<SelectItem 
value="gold-sparks-overlay" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.naturePark")}
</SelectItem>
<SelectItem 
value="rain-thunder-overlay" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.rain")}
</SelectItem>
<SelectItem 
value="summit-top" 
className="text-black dark:text-black focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-black dark:focus:text-black"
disabled={!hasScenesAccess}
>
{t("mirror.scenesOptions.summit")}
</SelectItem>
</SelectContent>
</Select>
</div>

{/* Feedback Checkbox */}
<div className="flex flex-col gap-2">
<div className="flex items-center gap-1 whitespace-nowrap">
<label className="text-sm font-medium text-black dark:text-black">
{t("mirror.feedback")}
</label>
</div>
<div className="flex items-center h-10">
<Checkbox
id="feedback-checkbox"
checked={showMeter && hasMeterAccess}
onCheckedChange={(checked) => {
if (hasMeterAccess) {
setShowMeter(!!checked);
}
}}
disabled={!hasMeterAccess}
className={cn(
"h-5 w-5 border border-border data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
!hasMeterAccess && "opacity-50 cursor-not-allowed"
)}
/>
<label
htmlFor="feedback-checkbox"
className="ml-2 text-sm text-black dark:text-black"
>
{t("mirror.enable")}
</label>
</div>
</div>
</div>

{/* Display Speed Slider */}
<div className="space-y-2">
<div className="flex items-center justify-between">
<label className="text-sm font-medium text-black dark:text-black">{t("mirror.displaySpeed")}</label>
<span className="text-sm text-gray-600 dark:text-gray-600">
{SPEED_OPTIONS.find(s => s.value === speed)?.label}
</span>
</div>
<Slider
value={[SPEED_OPTIONS.findIndex(s => s.value === speed)]}
onValueChange={(value) => setSpeed(SPEED_OPTIONS[value[0]].value)}
max={SPEED_OPTIONS.length - 1}
step={1}
className="w-full"
/>
</div>
</div>
)}
</div>
</Card>
<p className={cn("mt-3 text-center text-sm sm:text-base", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
{t("mirror.bestInApp")}
</p>

</main>

</div>
</div>
);
};

export default MirrorRehearsalWeb;