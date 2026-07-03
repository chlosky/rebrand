/**
 * Server-side subliminal mix (AudioProcessor parity).
 * Supabase Edge has no binary ffmpeg — PCM mix + WASM MP3 decode + lamejs encode.
 */
import { MPEGDecoder } from "npm:mpg123-decoder@1.0.3";

const BINAURAL_FREQUENCIES: Record<string, { base: number; offset: number }> = {
  delta: { base: 200, offset: 2 },
  theta: { base: 200, offset: 6 },
  alpha: { base: 250, offset: 10 },
  beta: { base: 300, offset: 20 },
  gamma: { base: 400, offset: 40 },
};

const BINAURAL_AMPLITUDE = 0.3;
const BINAURAL_GAIN = 0.4;
const AFFIRMATION_GAIN_MULTIPLIER = 0.5;
const LAYER_DELAY_SECONDS = 0.5;
const LAYER_ATTENUATION = 0.05;
const TARGET_SAMPLE_RATE = 22050;

export type ServerMixInput = {
  vocalMp3Bytes: Uint8Array;
  durationMinutes: number;
  binauralType: string;
  binauralVolume: number;
  backgroundSound: string;
  backgroundVolume: number;
  affirmationVolume: number;
  layers: number;
};

function resolveBackgroundUrl(filename: string): string {
  const soundsOrigin =
    Deno.env.get("SUBLIMINAL_SOUNDS_ORIGIN")?.trim() ||
    Deno.env.get("SOUNDS_ORIGIN")?.trim() ||
    "https://sounds-1og.pages.dev";
  const base = soundsOrigin.replace(/\/$/, "");
  try {
    const host = new URL(base).hostname;
    if (host.endsWith("pages.dev") || Deno.env.get("SUBLIMINAL_SOUNDS_AT_ROOT") === "true") {
      return `${base}/${encodeURIComponent(filename)}`;
    }
  } catch {
    /* fall through */
  }
  const siteOrigin = Deno.env.get("PUBLIC_SITE_ORIGIN")?.trim() || "https://paletteplot.com";
  return `${siteOrigin.replace(/\/$/, "")}/sounds/${encodeURIComponent(filename)}`;
}

function floatToInt16(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
}

function resampleChannel(input: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) return input;
  const outLen = Math.max(1, Math.ceil((input.length * outputRate) / inputRate));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = (i * inputRate) / outputRate;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;
    const a = input[idx] ?? 0;
    const b = input[Math.min(idx + 1, input.length - 1)] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function decodeWavPcm(bytes: Uint8Array): { sampleRate: number; channels: Float32Array[] } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 44 || String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF") {
    throw new Error("invalid_wav");
  }
  let offset = 12;
  let audioFormat = 1;
  let numChannels = 1;
  let sampleRate = 44100;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(chunkStart, true);
      numChannels = view.getUint16(chunkStart + 2, true);
      sampleRate = view.getUint32(chunkStart + 4, true);
      bitsPerSample = view.getUint16(chunkStart + 14, true);
    } else if (chunkId === "data") {
      dataOffset = chunkStart;
      dataSize = chunkSize;
      break;
    }
    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0 || audioFormat !== 1 || bitsPerSample !== 16) {
    throw new Error("unsupported_wav");
  }

  const frameCount = Math.floor(dataSize / (bitsPerSample / 8) / numChannels);
  const channels: Float32Array[] = Array.from({ length: numChannels }, () => new Float32Array(frameCount));
  let pos = dataOffset;
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = view.getInt16(pos, true);
      channels[ch][i] = sample / 0x8000;
      pos += 2;
    }
  }
  return { sampleRate, channels };
}

function isLikelyMp3(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // WebM/Matroska mislabeled as mp3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return false;
  // Ogg
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return false;
  // ID3 tag
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  // MPEG frame sync
  return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

async function decodeMp3ToChannels(mp3Bytes: Uint8Array): Promise<{ sampleRate: number; channels: Float32Array[] }> {
  if (!isLikelyMp3(mp3Bytes)) {
    throw new Error("vocal_not_valid_mp3");
  }

  const copy = new Uint8Array(mp3Bytes.byteLength);
  copy.set(mp3Bytes);

  const decoder = new MPEGDecoder();
  await decoder.ready;
  try {
    const { channelData, sampleRate, samplesDecoded, errors } = decoder.decode(copy);
    const decodeErrors = Array.isArray(errors) ? errors : [];
    if (!channelData?.length || !sampleRate || !samplesDecoded) {
      const errMsg = decodeErrors[0]?.message ?? "MPG123_ERR";
      throw new Error(`mp3_decode_failed:${errMsg}`);
    }
    if (decodeErrors.length > 0) {
      console.warn("[subliminalServerMix] mp3 decode warnings:", decodeErrors.length);
    }
    return { sampleRate, channels: channelData.map((ch) => new Float32Array(ch)) };
  } finally {
    decoder.free();
  }
}

function loopBackgroundToStereo(
  sourceChannels: Float32Array[],
  sourceRate: number,
  targetDurationSec: number,
  targetRate: number,
): [Float32Array, Float32Array] {
  const ratio = sourceRate / targetRate;
  const resampledLen = Math.max(1, Math.floor(sourceChannels[0].length / ratio));
  const targetLength = Math.ceil(targetDurationSec * targetRate);
  const fadeSamples = Math.min(Math.floor(0.15 * targetRate), Math.floor(resampledLen * 0.25));
  const stride = Math.max(1, resampledLen - fadeSamples);
  const loopCount = Math.ceil(targetLength / stride) + 1;

  const left = new Float32Array(targetLength);
  const right = new Float32Array(targetLength);
  const srcL = sourceChannels[0];
  const srcR = sourceChannels.length > 1 ? sourceChannels[1] : srcL;

  for (let loop = 0; loop < loopCount; loop++) {
    const loopStart = loop * stride;
    for (let i = 0; i < resampledLen; i++) {
      const outIdx = loopStart + i;
      if (outIdx >= targetLength) break;
      const srcIdx = Math.min(Math.floor(i * ratio), srcL.length - 1);
      let l = srcL[srcIdx];
      let r = srcR[srcIdx];
      if (loop > 0 && i < fadeSamples) {
        const f = Math.sqrt(i / fadeSamples);
        l *= f;
        r *= f;
      }
      if (i >= resampledLen - fadeSamples) {
        const f = Math.sqrt((resampledLen - i) / fadeSamples);
        l *= f;
        r *= f;
      }
      left[outIdx] += l;
      right[outIdx] += r;
    }
  }

  return [left, right];
}

function addBinauralBeat(
  left: Float32Array,
  right: Float32Array,
  type: string,
  volume: number,
  sampleRate: number,
): void {
  const freq = BINAURAL_FREQUENCIES[type.toLowerCase()];
  if (!freq) return;
  const gain = BINAURAL_GAIN * Math.max(0, Math.min(1, volume));
  const { base, offset } = freq;
  for (let i = 0; i < left.length; i++) {
    const t = i / sampleRate;
    left[i] += Math.sin(2 * Math.PI * base * t) * BINAURAL_AMPLITUDE * gain;
    right[i] += Math.sin(2 * Math.PI * (base + offset) * t) * BINAURAL_AMPLITUDE * gain;
  }
}

function addLayeredVocals(
  left: Float32Array,
  right: Float32Array,
  vocalChannels: Float32Array[],
  vocalRate: number,
  targetRate: number,
  durationSec: number,
  layers: number,
  affirmationVolume: number,
): void {
  const resampled = vocalChannels.map((ch) => resampleChannel(ch, vocalRate, targetRate));
  const vocalLen = resampled[0]?.length ?? 0;
  if (vocalLen === 0) return;

  const vL = resampled[0];
  const vR = resampled.length > 1 ? resampled[1] : vL;
  const totalGain = Math.min(1, affirmationVolume * AFFIRMATION_GAIN_MULTIPLIER);
  const baseGain = totalGain / Math.max(1, layers);
  const totalSamples = Math.min(left.length, Math.ceil(durationSec * targetRate));

  for (let layer = 0; layer < layers; layer++) {
    const delaySamples = Math.floor(layer * LAYER_DELAY_SECONDS * targetRate);
    const layerGain = baseGain * Math.max(0, 1 - layer * LAYER_ATTENUATION);
    for (let i = delaySamples; i < totalSamples; i++) {
      const srcIdx = (i - delaySamples) % vocalLen;
      left[i] += vL[srcIdx] * layerGain;
      right[i] += vR[srcIdx] * layerGain;
    }
  }
}

function applyFadeIn(left: Float32Array, right: Float32Array, sampleRate: number): void {
  const fadeSamples = Math.min(Math.floor(1.5 * sampleRate), left.length);
  for (let i = 0; i < fadeSamples; i++) {
    const f = i / fadeSamples;
    left[i] *= f;
    right[i] *= f;
  }
}

async function encodeStereoPcmToMp3(left: Float32Array, right: Float32Array, sampleRate: number): Promise<Uint8Array> {
  const lame = await import("npm:lamejsfixbug121");
  const lameModule = lame.default ?? lame;
  const Mp3Encoder = lameModule.Mp3Encoder ?? lame.Mp3Encoder;
  if (!Mp3Encoder) throw new Error("mp3_encoder_unavailable");

  (globalThis as Record<string, unknown>).MPEGMode ??= {
    STEREO: 0,
    JOINT_STEREO: 1,
    DUAL_CHANNEL: 2,
    MONO: 3,
    NOT_SET: 4,
  };

  const mp3encoder = new Mp3Encoder(2, sampleRate, 128);
  const sampleBlockSize = 1152;
  const leftFrame = new Int16Array(sampleBlockSize);
  const rightFrame = new Int16Array(sampleBlockSize);
  const mp3Chunks: Uint8Array[] = [];
  const numFrames = left.length;

  for (let i = 0; i < numFrames; i += sampleBlockSize) {
    const frameEnd = Math.min(i + sampleBlockSize, numFrames);
    const frameLength = frameEnd - i;
    for (let j = 0; j < frameLength; j++) {
      leftFrame[j] = floatToInt16(left[i + j]);
      rightFrame[j] = floatToInt16(right[i + j]);
    }
    const leftView = frameLength < sampleBlockSize ? leftFrame.subarray(0, frameLength) : leftFrame;
    const rightView = frameLength < sampleBlockSize ? rightFrame.subarray(0, frameLength) : rightFrame;
    const mp3buf = mp3encoder.encodeBuffer(leftView, rightView);
    if (mp3buf.length > 0) mp3Chunks.push(new Uint8Array(mp3buf));
  }

  const flushed = mp3encoder.flush();
  if (flushed.length > 0) mp3Chunks.push(new Uint8Array(flushed));

  let total = 0;
  for (const c of mp3Chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of mp3Chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

async function fetchBackgroundBytes(filename: string): Promise<Uint8Array | null> {
  const encoded = encodeURIComponent(filename);
  const candidates = [
    resolveBackgroundUrl(filename),
    `https://sounds-1og.pages.dev/${encoded}`,
    `https://paletteplot.com/sounds/${encoded}`,
  ];
  const tried = new Set<string>();
  for (const url of candidates) {
    if (tried.has(url)) continue;
    tried.add(url);
    const response = await fetch(url);
    if (response.ok) return new Uint8Array(await response.arrayBuffer());
    console.warn("[subliminalServerMix] background fetch miss:", url, response.status);
  }
  return null;
}

async function fetchBackgroundStereo(
  backgroundSound: string,
  durationSec: number,
  sampleRate: number,
): Promise<[Float32Array, Float32Array]> {
  const silent = (): [Float32Array, Float32Array] => {
    const len = Math.ceil(durationSec * sampleRate);
    return [new Float32Array(len), new Float32Array(len)];
  };

  if (!backgroundSound || backgroundSound === "none" || backgroundSound === "Your Custom Sound") {
    return silent();
  }

  const filename = backgroundSound.includes(".") ? backgroundSound : `${backgroundSound}.wav`;
  const bytes = await fetchBackgroundBytes(filename);
  if (!bytes) {
    console.warn("[subliminalServerMix] background unavailable:", backgroundSound);
    return silent();
  }

  try {
    const { sampleRate: srcRate, channels } = decodeWavPcm(bytes);
    const resampledChannels = channels.map((ch) => resampleChannel(ch, srcRate, sampleRate));
    return loopBackgroundToStereo(resampledChannels, sampleRate, durationSec, sampleRate);
  } catch (e) {
    console.warn("[subliminalServerMix] background decode failed:", backgroundSound, e);
    return silent();
  }
}

export async function mixSubliminalHandoffTrack(input: ServerMixInput): Promise<Uint8Array> {
  let sampleRate = TARGET_SAMPLE_RATE;
  const durationSec = input.durationMinutes * 60;
  if (durationSec >= 1200) sampleRate = 16000;

  const totalSamples = Math.ceil(durationSec * sampleRate);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const binauralType = input.binauralType.trim().toLowerCase();
  if (binauralType && binauralType !== "none") {
    addBinauralBeat(left, right, binauralType, input.binauralVolume, sampleRate);
  }

  const [bgL, bgR] = await fetchBackgroundStereo(input.backgroundSound, durationSec, sampleRate);
  const bgVol = Math.max(0, Math.min(1, input.backgroundVolume));
  for (let i = 0; i < totalSamples; i++) {
    left[i] += (bgL[i] ?? 0) * bgVol;
    right[i] += (bgR[i] ?? 0) * bgVol;
  }

  const vocal = await decodeMp3ToChannels(input.vocalMp3Bytes);
  addLayeredVocals(
    left,
    right,
    vocal.channels,
    vocal.sampleRate,
    sampleRate,
    durationSec,
    Math.max(1, input.layers),
    input.affirmationVolume,
  );

  applyFadeIn(left, right, sampleRate);
  return encodeStereoPcmToMp3(left, right, sampleRate);
}
