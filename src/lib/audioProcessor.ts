import { supabase } from "@/integrations/supabase/client";
import { createMp3Encoder } from "wasm-media-encoders";
import { Capacitor } from "@capacitor/core";

// Type definitions for binaural frequencies (structure only, values come from edge function)
export type BinauralType = 'none' | 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface SubliminalSettings {
  affirmationBlob: Blob;
  binauralType: BinauralType;
  /** 0–1; scales proprietary binaural gain. Ignored when binauralType is none. */
  binauralVolume: number;
  backgroundSound: string;
  backgroundSoundUrl?: string; // Optional URL for user-created tracks
  affirmationVolume: number;
  backgroundVolume: number;
  layers: number;
  duration: number; // in seconds
  /** 0–100 during offline mix + MP3 encode (post-paywall progress UI). */
  onMixProgress?: (percent: number) => void;
}

// Subliminal audio mixing parameters (fetched from edge function)
interface SubliminalParams {
  binauralFrequencies: {
    delta: { base: number; offset: number };
    theta: { base: number; offset: number };
    alpha: { base: number; offset: number };
    beta: { base: number; offset: number };
    gamma: { base: number; offset: number };
  };
  binauralAmplitude: number;
  binauralGain: number;
  affirmationGainMultiplier: number;
  layerDelaySeconds: number;
  layerAttenuation: number;
  targetSampleRate: number;
  audioDetectionThreshold: number;
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private subliminalParams: SubliminalParams | null = null;
  private paramsFetchPromise: Promise<SubliminalParams> | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  // Fetch proprietary mixing parameters from edge function
  private async getSubliminalParams(): Promise<SubliminalParams> {
    // Return cached params if available
    if (this.subliminalParams) {
      return this.subliminalParams;
    }

    // Return existing fetch promise if in progress
    if (this.paramsFetchPromise) {
      return this.paramsFetchPromise;
    }

    // Fetch params from edge function
    this.paramsFetchPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-subliminal-params");

        if (error) {
          console.error("Error fetching subliminal params:", error);
          // Fallback to default values if fetch fails
          return this.getDefaultParams();
        }

        if (data?.params) {
          this.subliminalParams = data.params;
          return data.params;
        }

        return this.getDefaultParams();
      } catch (err) {
        console.error("Error fetching subliminal params:", err);
        return this.getDefaultParams();
      }
    })();

    return this.paramsFetchPromise;
  }

  // Default fallback parameters (used if edge function fails)
  private getDefaultParams(): SubliminalParams {
    return {
      binauralFrequencies: {
        delta: { base: 200, offset: 2 },
        theta: { base: 200, offset: 6 },
        alpha: { base: 250, offset: 10 },
        beta: { base: 300, offset: 20 },
        gamma: { base: 400, offset: 40 },
      },
      binauralAmplitude: 0.3,
      binauralGain: 0.33,
      affirmationGainMultiplier: 0.25,
      layerDelaySeconds: 0.5,
      layerAttenuation: 0.05,
      targetSampleRate: 22050,
      audioDetectionThreshold: 0.001,
    };
  }

  // Generate binaural beat tones
  private async createBinauralBeat(
    ctx: BaseAudioContext,
    type: Exclude<BinauralType, "none">,
    duration: number,
    sampleRate: number
  ): Promise<AudioBuffer> {
    const params = await this.getSubliminalParams();
    const { base, offset } = params.binauralFrequencies[type];
    const amplitude = params.binauralAmplitude;
    
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Left ear frequency (proprietary amplitude)
    for (let i = 0; i < length; i++) {
      leftChannel[i] = Math.sin(2 * Math.PI * base * (i / sampleRate)) * amplitude;
    }

    // Right ear frequency (offset creates the binaural beat) - proprietary amplitude
    for (let i = 0; i < length; i++) {
      rightChannel[i] = Math.sin(2 * Math.PI * (base + offset) * (i / sampleRate)) * amplitude;
    }

    return buffer;
  }

  // Load audio file as AudioBuffer
  private async loadAudioBuffer(source: Blob | string, ctx: BaseAudioContext): Promise<AudioBuffer> {
    let arrayBuffer: ArrayBuffer;
    let blobType: string | undefined;

    if (source instanceof Blob) {
      if (source.size === 0) {
        throw new Error("Affirmation blob is empty (0 bytes)");
      }
      blobType = source.type;
      console.log("Loading blob, size:", source.size, "type:", blobType);
      arrayBuffer = await source.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Affirmation blob arrayBuffer is empty");
      }
    } else {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      blobType = response.headers.get('content-type') || undefined;
      arrayBuffer = await response.arrayBuffer();
    }

    try {
      // Try to decode with the original arrayBuffer
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      console.log("Audio buffer decoded successfully:", {
        sampleRate: buffer.sampleRate,
        length: buffer.length,
        duration: buffer.length / buffer.sampleRate,
        channels: buffer.numberOfChannels
      });
      return buffer;
    } catch (error) {
      console.error("Failed to decode audio data:", error);
      console.error("Blob type:", blobType, "ArrayBuffer size:", arrayBuffer.byteLength);
      
      // Provide more helpful error message
      if (blobType && !blobType.startsWith('audio/')) {
        throw new Error(`Invalid audio format. The recording format (${blobType}) may not be supported. Please try recording again. If the issue persists, try using a different browser.`);
      }
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error("Audio file appears to be corrupted or too small. Please record again.");
      }
      
      throw new Error(`Failed to decode audio: ${error instanceof Error ? error.message : String(error)}. The audio format may not be supported. Please try recording again.`);
    }
  }

  // Get or generate background sound
  private async getBackgroundSound(type: string, duration: number, sampleRate: number, ctx: BaseAudioContext): Promise<AudioBuffer> {
    // Check if this is a user track (prefixed with "user:")
    if (type.startsWith("user:")) {
      const trackId = type.replace("user:", "");
      // Load track URL from database - we'll need to pass this or fetch it
      // For now, we'll expect the full URL to be passed or fetch it
      // This will be handled by the caller providing the URL
      throw new Error("User tracks should be loaded with their full URL");
    }

    // type may be a full filename (with extension) or a base name (default .wav)
    const filename = type.includes(".") ? type : `${type}.wav`;
    // Native: fetch from sounds host (files at root). Default to Cloudflare sounds project so we get real WAV, not SPA HTML from main site.
    const soundsBase =
      typeof window !== "undefined" && Capacitor.isNativePlatform()
        ? (import.meta.env.VITE_SOUNDS_ORIGIN as string | undefined) ||
          (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined) ||
          "https://sounds-1og.pages.dev"
        : typeof window !== "undefined"
          ? window.location.origin
          : "";
    // Native: sounds project has files at root. Web: main site has /sounds/ subpath.
    const useSoundsSubpath = typeof window !== "undefined" && !Capacitor.isNativePlatform();
    const url = useSoundsSubpath
      ? `${soundsBase}/sounds/${encodeURIComponent(filename)}`
      : `${soundsBase.replace(/\/$/, "")}/${encodeURIComponent(filename)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Background sound "${filename}" could not be loaded (${response.status}). Make sure files exist in public/sounds/.`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const baseBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return this.loopBuffer(baseBuffer, duration, sampleRate);
  }

  // Loop a short buffer to match target duration with crossfade at seams
  private loopBuffer(sourceBuffer: AudioBuffer, targetDuration: number, targetSampleRate: number): AudioBuffer {
    const ratio = sourceBuffer.sampleRate / targetSampleRate;
    const resampledLen = Math.floor(sourceBuffer.length / ratio);
    const targetLength = Math.ceil(targetDuration * targetSampleRate);
    const fadeSamples = Math.min(Math.floor(0.15 * targetSampleRate), Math.floor(resampledLen * 0.25));
    const stride = resampledLen - fadeSamples;
    const loopCount = Math.ceil(targetLength / stride) + 1;

    const outputBuffer = this.audioContext.createBuffer(
      sourceBuffer.numberOfChannels,
      targetLength,
      targetSampleRate
    );

    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
      const src = sourceBuffer.getChannelData(channel);
      const out = outputBuffer.getChannelData(channel);

      for (let loop = 0; loop < loopCount; loop++) {
        const loopStart = loop * stride;
        for (let i = 0; i < resampledLen; i++) {
          const outIdx = loopStart + i;
          if (outIdx >= targetLength) break;
          const srcIdx = Math.min(Math.floor(i * ratio), src.length - 1);
          let sample = src[srcIdx];
          if (loop > 0 && i < fadeSamples) {
            sample *= Math.sqrt(i / fadeSamples);
          }
          if (i >= resampledLen - fadeSamples) {
            sample *= Math.sqrt((resampledLen - i) / fadeSamples);
          }
          out[outIdx] += sample;
        }
      }
    }

    return outputBuffer;
  }

  // Mix all audio layers into final subliminal track
  async generateSubliminalTrack(settings: SubliminalSettings): Promise<Blob> {
    const duration = settings.duration * 60; // convert minutes to seconds

    settings.onMixProgress?.(40);
    
    // Get proprietary mixing parameters from edge function
    const params = await this.getSubliminalParams();
    
    // Use the target sample rate from params - client-side WASM encoding handles any size
    // Only reduce for very long tracks to keep encoding time reasonable
    let targetSampleRate = params.targetSampleRate; // Default: 22050 Hz
    
    // For tracks over 20 minutes, reduce sample rate slightly to speed up encoding
    // This is optional for quality vs. speed tradeoff
    if (duration >= 1200) { // >= 20 minutes
      targetSampleRate = 16000;
      console.log(`Long track detected (${duration}s), using ${targetSampleRate} Hz for faster encoding`);
    }
    
    const estimatedPcmMB = (duration * targetSampleRate * 2 * 4) / (1024 * 1024); // Float32 = 4 bytes
    console.log(`Creating audio: ${duration}s at ${targetSampleRate} Hz, estimated PCM: ${estimatedPcmMB.toFixed(1)} MB`);
    
    // Create offline context for rendering with reduced sample rate
    const offlineContext = new OfflineAudioContext(
      2,
      targetSampleRate * duration,
      targetSampleRate
    );

    // 1. Optional binaural beats (use target sample rate)
    if (settings.binauralType !== "none") {
      const binauralBuffer = await this.createBinauralBeat(
        offlineContext,
        settings.binauralType,
        duration,
        targetSampleRate
      );
      const binauralSource = offlineContext.createBufferSource();
      binauralSource.buffer = binauralBuffer;
      const binauralGain = offlineContext.createGain();
      const vol = Math.max(0, Math.min(1, settings.binauralVolume));
      binauralGain.gain.value = params.binauralGain * vol;
      binauralSource.connect(binauralGain);
      binauralGain.connect(offlineContext.destination);
      binauralSource.start(0);
    }

    // 2. Generate/load background sound (use target sample rate)
    let backgroundBuffer: AudioBuffer;
    const presetSound = settings.backgroundSound && !settings.backgroundSound.startsWith("user:");
    console.log(
      "Loading background sound:",
      settings.backgroundSound,
      presetSound ? "(preset — fetched by filename, not backgroundSoundUrl)" : "URL:",
      presetSound ? undefined : settings.backgroundSoundUrl,
    );
    if (!settings.backgroundSound || settings.backgroundSound === "" || settings.backgroundSound === "none") {
      // No background sound - create silent buffer
      backgroundBuffer = offlineContext.createBuffer(2, duration * targetSampleRate, targetSampleRate);
    } else if (settings.backgroundSound.startsWith("user:")) {
      // User track - must have URL provided
      console.log("Processing user track, URL:", settings.backgroundSoundUrl);
      if (!settings.backgroundSoundUrl) {
        throw new Error(`User track selected but URL not provided. Track ID: ${settings.backgroundSound.replace("user:", "")}`);
      }
      try {
        console.log("Fetching user track from:", settings.backgroundSoundUrl);
        const response = await fetch(settings.backgroundSoundUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch user track: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const baseBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0));
        backgroundBuffer = this.loopBuffer(baseBuffer, duration, targetSampleRate);
        console.log("User track loaded successfully");
      } catch (error) {
        console.error("Error loading user track:", error);
        throw new Error(`Failed to load user track from URL: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Regular background sound
      backgroundBuffer = await this.getBackgroundSound(settings.backgroundSound, duration, targetSampleRate, offlineContext);
    }

    const backgroundSource = offlineContext.createBufferSource();
    backgroundSource.buffer = backgroundBuffer;
    backgroundSource.loop = true; // Loop background sound
    const backgroundGain = offlineContext.createGain();
    backgroundGain.gain.value = settings.backgroundVolume;
    backgroundSource.connect(backgroundGain);
    backgroundGain.connect(offlineContext.destination);
    backgroundSource.start(0);

    // 3. Load affirmation audio and resample if needed
    console.log("Loading affirmation audio, blob size:", settings.affirmationBlob.size);
    const affirmationBuffer = await this.loadAudioBuffer(settings.affirmationBlob, offlineContext);
    console.log("Affirmation buffer loaded:", {
      sampleRate: affirmationBuffer.sampleRate,
      length: affirmationBuffer.length,
      duration: affirmationBuffer.length / affirmationBuffer.sampleRate,
      channels: affirmationBuffer.numberOfChannels
    });
    
    // Resample affirmation buffer to match target sample rate if needed
    const resampledAffirmationBuffer = affirmationBuffer.sampleRate !== targetSampleRate
      ? await this.resampleAudioBuffer(affirmationBuffer, targetSampleRate)
      : affirmationBuffer;
    
    console.log("Resampled affirmation buffer:", {
      sampleRate: resampledAffirmationBuffer.sampleRate,
      length: resampledAffirmationBuffer.length,
      duration: resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate
    });
    
    // Check if buffer has audio data (use a sample to avoid stack overflow)
    const channelData = resampledAffirmationBuffer.getChannelData(0);
    let maxAmplitude = 0;
    const sampleSize = Math.min(10000, channelData.length); // Sample first 10k samples
    for (let i = 0; i < sampleSize; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    const hasAudio = maxAmplitude > params.audioDetectionThreshold; // Proprietary detection threshold
    console.log("Affirmation buffer audio check:", {
      maxAmplitude,
      hasAudio,
      bufferLength: channelData.length,
      firstSamples: Array.from(channelData.slice(0, 10))
    });
    
    if (!hasAudio) {
      console.warn("WARNING: Affirmation buffer appears to be silent!");
    }

    // 4. Layer affirmations multiple times at subliminal volume
    // Divide by layer count so total volume stays consistent regardless of layers
    // (layers are additive - without this, more layers = louder total volume)
    const totalGain = Math.min(1, settings.affirmationVolume * params.affirmationGainMultiplier);
    const baseAffirmationGain = totalGain / settings.layers;
    console.log("Affirmation settings:", {
      volume: settings.affirmationVolume,
      totalGain: totalGain,
      perLayerGain: baseAffirmationGain,
      layers: settings.layers
    });

    // Ensure affirmations play for the full duration
    const affirmationDuration = resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate;
    console.log("Affirmation duration:", affirmationDuration, "Track duration:", duration);

    for (let layer = 0; layer < settings.layers; layer++) {
      const layerDelay = layer * params.layerDelaySeconds; // Proprietary layer delay
      const affirmationSource = offlineContext.createBufferSource();
      affirmationSource.buffer = resampledAffirmationBuffer;
      affirmationSource.loop = true; // Loop affirmations
      
      const affirmationGain = offlineContext.createGain();
      // Proprietary layer attenuation: each layer slightly quieter to create subliminal whisper effect
      const layerAttenuation = Math.max(0, 1 - layer * params.layerAttenuation);
      affirmationGain.gain.value = baseAffirmationGain * layerAttenuation;
      
      console.log(`Layer ${layer}: gain=${affirmationGain.gain.value}, delay=${layerDelay}, will play until ${duration}s`);
      
      affirmationSource.connect(affirmationGain);
      affirmationGain.connect(offlineContext.destination);
      affirmationSource.start(layerDelay);
      // Stop at the end of the track duration
      affirmationSource.stop(duration);
    }

    settings.onMixProgress?.(55);

    // Render the mixed audio
    const renderedBuffer = await offlineContext.startRendering();

    settings.onMixProgress?.(72);

    // 1.5s fade-in at the very start of the final track
    const fadeInSamples = Math.min(Math.floor(1.5 * renderedBuffer.sampleRate), renderedBuffer.length);
    for (let ch = 0; ch < renderedBuffer.numberOfChannels; ch++) {
      const data = renderedBuffer.getChannelData(ch);
      for (let i = 0; i < fadeInSamples; i++) {
        data[i] *= i / fadeInSamples;
      }
    }

    // Convert to MP3 using client-side WASM encoder
    const mp3Blob = await this.bufferToMp3(renderedBuffer, settings.onMixProgress);
    return mp3Blob;
  }

  // Convert AudioBuffer to MP3 Blob using client-side WASM encoder
  private async bufferToMp3(
    buffer: AudioBuffer,
    onMixProgress?: (percent: number) => void
  ): Promise<Blob> {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const samples = buffer.length;
    
    console.log(`Starting client-side MP3 encoding: ${samples} samples, ${sampleRate} Hz, ${numChannels} channels`);
    const startTime = performance.now();
    
    // Get Float32 channel data
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;
    
    // Initialize WASM MP3 encoder
    const encoder = await createMp3Encoder();
    
    // Configure encoder: use VBR quality 2 for good quality, or can use bitrate: 128
    encoder.configure({
      sampleRate,
      channels: numChannels as 1 | 2, // WASM encoder expects 1 or 2 channels
      vbrQuality: 2, // Good quality VBR (0=best, 9=worst)
    });
    
    // Encode in chunks to allow for progress reporting and prevent blocking
    const chunkSize = 1152 * 32; // Process ~32 frames at a time
    const mp3Chunks: Uint8Array[] = [];
    let totalMp3Size = 0;
    
    for (let i = 0; i < samples; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples);
      const leftChunk = leftChannel.subarray(i, end);
      const rightChunk = numChannels > 1 ? rightChannel.subarray(i, end) : leftChunk;
      
      // Encode chunk - wasm-media-encoders expects Float32Array per channel
      const mp3Data = encoder.encode([leftChunk, rightChunk]);
      
      if (mp3Data.length > 0) {
        // IMPORTANT: Must copy the data as it's owned by the encoder
        const copy = new Uint8Array(mp3Data.length);
        copy.set(mp3Data);
        mp3Chunks.push(copy);
        totalMp3Size += copy.length;
      }
      
      const progress = Math.floor((i / samples) * 100);
      onMixProgress?.(72 + Math.round(progress * 0.28));
      if (progress % 10 === 0 && i > 0) {
        console.log(`MP3 encoding progress: ${progress}%`);
      }
    }
    
    // Finalize encoding
    const finalData = encoder.finalize();
    if (finalData.length > 0) {
      const copy = new Uint8Array(finalData.length);
      copy.set(finalData);
      mp3Chunks.push(copy);
      totalMp3Size += copy.length;
    }
    
    // Combine all chunks into single buffer
    const mp3Buffer = new Uint8Array(totalMp3Size);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      mp3Buffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    const endTime = performance.now();
    const encodingTime = ((endTime - startTime) / 1000).toFixed(2);
    const sizeMB = (totalMp3Size / (1024 * 1024)).toFixed(2);
    console.log(`MP3 encoding complete: ${sizeMB} MB in ${encodingTime}s`);
    
    return new Blob([mp3Buffer], { type: "audio/mpeg" });
  }

  // Resample AudioBuffer to target sample rate
  private async resampleAudioBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil(buffer.length * targetSampleRate / buffer.sampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    return await offlineContext.startRendering();
  }

  async encodeBlobToMp3(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
    return this.bufferToMp3(decoded);
  }

  // Clean up resources
  dispose() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
