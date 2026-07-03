/**
 * DEPRECATED: This edge function is no longer used.
 * MP3 encoding is now done client-side using wasm-media-encoders.
 * This file is kept for reference/fallback purposes.
 * 
 * @deprecated Use client-side WASM encoding in audioProcessor.ts instead
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";

  if (!(error instanceof Error)) return defaultMessage;

  const message = error.message.toLowerCase();
  if (
    message.includes("cannot find module") ||
    message.includes("file") ||
    message.includes("path") ||
    message.includes("import") ||
    message.includes("module")
  ) {
    return "Internal error. Please try again.";
  }
  return defaultMessage;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sample-rate, x-channels, x-bitrate-kbps",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We're sending RAW BYTES, not base64.
    // Metadata comes from headers.
    const sampleRate = Number(req.headers.get("x-sample-rate") ?? "22050");
    const channels = Number(req.headers.get("x-channels") ?? "2");
    const bitrateKbps = Number(req.headers.get("x-bitrate-kbps") ?? "128");

    if (!sampleRate || sampleRate < 8000 || sampleRate > 48000) {
      throw new Error("Invalid sample rate");
    }
    if (channels < 1 || channels > 2) {
      throw new Error("Channels must be 1 (mono) or 2 (stereo)");
    }
    if (!bitrateKbps || bitrateKbps < 32 || bitrateKbps > 320) {
      throw new Error("Invalid bitrate");
    }

    // Read raw PCM bytes (Int16 little-endian). This avoids atob() + giant strings.
    const pcmBuffer = await req.arrayBuffer();
    const pcmBytes = new Uint8Array(pcmBuffer);

    // Basic size guard (tune as you want). This is actual bytes now.
    const pcmSizeMB = pcmBytes.byteLength / (1024 * 1024);
    console.log(
      `Processing audio: ${pcmSizeMB.toFixed(2)} MB PCM bytes, ${sampleRate} Hz, ${channels} channel(s)`
    );

    // Example limit: 200MB raw PCM bytes. (Pick whatever is sane for your Edge plan.)
    if (pcmSizeMB > 200) {
      return new Response(
        JSON.stringify({
          error: `Audio file too large (${pcmSizeMB.toFixed(
            2
          )} MB). Please try a shorter track or reduce sample rate.`,
          maxSizeMB: 200,
          actualSizeMB: pcmSizeMB,
          sampleRate,
          channels,
        }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Interpret bytes as Int16 samples
    if (pcmBytes.byteLength % 2 !== 0) {
      throw new Error("Invalid PCM byte length (must be multiple of 2)");
    }
    
    // Debug: verify we received actual data
    console.log("PCM byteLength:", pcmBytes.byteLength);
    
    const pcmSamples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);

    // Try the patched version of lamejs that fixes global variable issues
    // lamejsfixbug121 was specifically created to fix MPEGMode/BitStream/etc. issues
    let lameModule: any;
    let Mp3Encoder: any;
    
    try {
      // Try the patched version first - it fixes the global variable issues
      // Note: no version specifier as the package might use a different version number
      const lame = await import("npm:lamejsfixbug121");
      lameModule = lame.default ?? lame;
      Mp3Encoder = lameModule.Mp3Encoder ?? lame.Mp3Encoder;
      console.log("Using npm:lamejsfixbug121, exports:", Object.keys(lameModule));
    } catch (patchedError) {
      console.warn("lamejsfixbug121 failed:", patchedError);
      
      try {
        // Fallback to regular lamejs with manual BitStream import
        const lame = await import("npm:lamejs@1.2.1");
        lameModule = lame.default ?? lame;
        
        // Try to import BitStream separately and assign to globalThis
        try {
          const bitstream = await import("npm:lamejs@1.2.1/src/js/BitStream.js");
          (globalThis as any).BitStream = bitstream.default ?? bitstream;
        } catch (e) {
          console.warn("Could not import BitStream separately:", e);
        }
        
        // Assign all exports to globalThis
        if (lameModule && typeof lameModule === 'object') {
          for (const key of Object.keys(lameModule)) {
            if (!(globalThis as any)[key]) {
              (globalThis as any)[key] = (lameModule as any)[key];
            }
          }
        }
        
        (globalThis as any).Lame ??= lameModule;
        (globalThis as any).lamejs ??= lameModule;
        
        Mp3Encoder = lameModule.Mp3Encoder ?? lame.Mp3Encoder;
        console.log("Using npm:lamejs with manual BitStream, exports:", Object.keys(lameModule));
      } catch (npmError) {
        console.warn("npm:lamejs failed, trying esm.sh:", npmError);
        
        // Last resort: esm.sh bundled version
        const lame = await import("https://esm.sh/lamejs@1.2.1?bundle&target=es2022");
        lameModule = lame.default ?? lame;
        
        // Assign all exports to globalThis
        if (lameModule && typeof lameModule === 'object') {
          for (const key of Object.keys(lameModule)) {
            if (!(globalThis as any)[key]) {
              (globalThis as any)[key] = (lameModule as any)[key];
            }
          }
        }
        
        (globalThis as any).Lame ??= lameModule;
        (globalThis as any).lamejs ??= lameModule;
        
        Mp3Encoder = lameModule.Mp3Encoder ?? lame.Mp3Encoder;
        console.log("Using esm.sh lamejs, exports:", Object.keys(lameModule));
      }
    }
    
    // Provide MPEGMode if not already available
    (globalThis as any).MPEGMode ??= {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3,
      NOT_SET: 4,
    };

    if (!Mp3Encoder) throw new Error("Mp3Encoder not found");

    const mp3encoder = new Mp3Encoder(channels, sampleRate, bitrateKbps);
    const sampleBlockSize = 1152; // MP3 frame size
    
    // Pre-allocate arrays for stereo processing (reuse to reduce GC pressure)
    const leftFrame = new Int16Array(sampleBlockSize);
    const rightFrame = new Int16Array(sampleBlockSize);

    const mp3Chunks: Uint8Array[] = [];
    let totalMp3Size = 0;
    let framesProcessed = 0;

    if (channels === 2) {
      // Interleaved stereo: L, R, L, R...
      const numFrames = Math.floor(pcmSamples.length / 2);
      const totalFrameChunks = Math.ceil(numFrames / sampleBlockSize);

      for (let i = 0; i < numFrames; i += sampleBlockSize) {
        const frameEnd = Math.min(i + sampleBlockSize, numFrames);
        const frameLength = frameEnd - i;

        // Fill pre-allocated arrays (faster than creating new ones each time)
        for (let j = 0; j < frameLength; j++) {
          const idx = (i + j) * 2;
          leftFrame[j] = pcmSamples[idx];
          rightFrame[j] = pcmSamples[idx + 1];
        }

        // Use subarray view if frameLength is less than sampleBlockSize
        const leftView = frameLength < sampleBlockSize ? leftFrame.subarray(0, frameLength) : leftFrame;
        const rightView = frameLength < sampleBlockSize ? rightFrame.subarray(0, frameLength) : rightFrame;

        const mp3buf = mp3encoder.encodeBuffer(leftView, rightView);
        if (mp3buf.length > 0) {
          mp3Chunks.push(new Uint8Array(mp3buf));
          totalMp3Size += mp3buf.length;
        }
        
        framesProcessed++;
        // Log progress every 10%
        if (framesProcessed % Math.ceil(totalFrameChunks / 10) === 0) {
          const pct = Math.round((framesProcessed / totalFrameChunks) * 100);
          console.log(`Encoding progress: ${pct}%`);
        }
      }
    } else {
      const totalChunks = Math.ceil(pcmSamples.length / sampleBlockSize);
      for (let i = 0; i < pcmSamples.length; i += sampleBlockSize) {
        const chunk = pcmSamples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
          mp3Chunks.push(new Uint8Array(mp3buf));
          totalMp3Size += mp3buf.length;
        }
        
        framesProcessed++;
        if (framesProcessed % Math.ceil(totalChunks / 10) === 0) {
          const pct = Math.round((framesProcessed / totalChunks) * 100);
          console.log(`Encoding progress: ${pct}%`);
        }
      }
    }

    const flushed = mp3encoder.flush();
    if (flushed.length > 0) {
      const u8 = new Uint8Array(flushed);
      mp3Chunks.push(u8);
      totalMp3Size += u8.length;
    }

    const mp3Buffer = new Uint8Array(totalMp3Size);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      mp3Buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return base64 MP3 (easy for JSON response)
    const mp3Base64 = base64Encode(mp3Buffer);

    return new Response(
      JSON.stringify({ success: true, mp3Data: mp3Base64, size: mp3Buffer.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error converting PCM to MP3:", error);
    return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
