import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const OUT_DIR = join(process.cwd(), "public", "notification-sounds", "manifestation-routine");

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  writeFileSync(filePath, buffer);
}

function envADSR(t, attack, decay, sustain, release, duration) {
  if (t < attack) return t / attack;
  if (t < attack + decay) {
    const p = (t - attack) / decay;
    return 1 - p * (1 - sustain);
  }
  if (t < duration - release) return sustain;
  if (t < duration) return sustain * (1 - (t - (duration - release)) / release);
  return 0;
}

function sine(freq, t, phase = 0) {
  return Math.sin(2 * Math.PI * freq * t + phase);
}

function render(durationSec, mixer) {
  const length = Math.ceil(durationSec * SAMPLE_RATE);
  const out = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = mixer(t, i, length);
  }
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const gain = 0.92 / peak;
    for (let i = 0; i < length; i++) out[i] *= gain;
  }
  return out;
}

function tone(freq, start, dur, amp = 1, attack = 0.01, decay = 0.08) {
  return (t) => {
    if (t < start || t > start + dur) return 0;
    const local = t - start;
    const e = envADSR(local, attack, decay, 0.15, Math.max(0.05, dur * 0.55), dur);
    return amp * e * sine(freq, local);
  };
}

function fmBell(freq, start, dur, amp = 1) {
  return (t) => {
    if (t < start || t > start + dur) return 0;
    const local = t - start;
    const e = envADSR(local, 0.003, 0.12, 0.08, dur * 0.7, dur);
    const mod = sine(freq * 2.4, local) * 2.2;
    return amp * e * Math.sin(2 * Math.PI * freq * local + mod);
  };
}

function sparkle(start, dur, amp = 0.35) {
  return (t) => {
    if (t < start || t > start + dur) return 0;
    const local = t - start;
    const e = Math.exp(-local * 14);
    const freqs = [2200, 3100, 4100, 5200];
    let s = 0;
    for (let n = 0; n < freqs.length; n++) {
      s += sine(freqs[n] + n * 40, local) * Math.exp(-n * 0.35);
    }
    return amp * e * s * 0.25;
  };
}

function mix(...fns) {
  return (t, i, len) => fns.reduce((sum, fn) => sum + fn(t, i, len), 0);
}

const SOUNDS = [
  {
    file: "01-crystal-chime.wav",
    label: "Crystal Chime",
    duration: 0.95,
    mix: mix(tone(1760, 0, 0.9, 1), tone(2640, 0.02, 0.75, 0.35)),
  },
  {
    file: "02-moon-bell.wav",
    label: "Moon Bell",
    duration: 1.05,
    mix: mix(fmBell(523.25, 0, 1.0, 0.9), tone(659.25, 0.08, 0.8, 0.45)),
  },
  {
    file: "03-stardust-spark.wav",
    label: "Stardust Spark",
    duration: 0.75,
    mix: mix(
      tone(988, 0, 0.18, 0.5, 0.002, 0.05),
      tone(1319, 0.07, 0.18, 0.45, 0.002, 0.05),
      tone(1760, 0.14, 0.22, 0.55, 0.002, 0.06),
      sparkle(0.12, 0.35, 0.4),
    ),
  },
  {
    file: "04-aura-ping.wav",
    label: "Aura Ping",
    duration: 0.65,
    mix: mix(tone(880, 0, 0.55, 1, 0.001, 0.1), tone(1320, 0, 0.45, 0.25, 0.001, 0.08)),
  },
  {
    file: "05-dream-glass.wav",
    label: "Dream Glass",
    duration: 1.1,
    mix: mix(fmBell(740, 0, 1.05, 0.85), tone(987.77, 0.05, 0.85, 0.3)),
  },
  {
    file: "06-mystic-duo.wav",
    label: "Mystic Duo",
    duration: 0.9,
    mix: mix(tone(622.25, 0, 0.8, 0.8), tone(932.33, 0, 0.8, 0.55)),
  },
  {
    file: "07-celestial-bloom.wav",
    label: "Celestial Bloom",
    duration: 1.15,
    mix: mix(
      tone(440, 0, 0.25, 0.35, 0.08, 0.12),
      tone(554.37, 0.12, 0.35, 0.55, 0.02, 0.15),
      tone(659.25, 0.22, 0.65, 0.75, 0.01, 0.2),
    ),
  },
  {
    file: "08-fairy-dust.wav",
    label: "Fairy Dust",
    duration: 0.8,
    mix: mix(
      sparkle(0, 0.45, 0.55),
      tone(1568, 0.18, 0.35, 0.35, 0.002, 0.08),
      tone(2093, 0.28, 0.3, 0.3, 0.002, 0.07),
    ),
  },
  {
    file: "09-cosmic-droplet.wav",
    label: "Cosmic Droplet",
    duration: 0.85,
    mix: mix(
      (t) => {
        if (t > 0.35) return 0;
        const e = Math.exp(-t * 18);
        return e * sine(1200 - t * 1800, t) * 0.45;
      },
      tone(1046.5, 0.05, 0.7, 0.75, 0.003, 0.12),
    ),
  },
  {
    file: "10-violet-glow.wav",
    label: "Violet Glow",
    duration: 0.9,
    mix: mix(tone(349.23, 0, 0.85, 0.65), tone(523.25, 0.04, 0.75, 0.5), tone(698.46, 0.08, 0.55, 0.35)),
  },
  {
    file: "11-ether-whisper.wav",
    label: "Ether Whisper",
    duration: 0.95,
    mix: mix(
      (t) => {
        const e = envADSR(t, 0.04, 0.2, 0.1, 0.45, 0.95);
        const noise = (Math.sin(t * 9973) + Math.sin(t * 4327)) * 0.5;
        return e * noise * 0.08;
      },
      tone(784, 0.06, 0.75, 0.7, 0.02, 0.15),
    ),
  },
  {
    file: "12-spell-cast.wav",
    label: "Spell Cast",
    duration: 0.7,
    mix: mix(
      (t) => {
        if (t > 0.22) return 0;
        const e = Math.exp(-t * 10);
        return e * sine(400 + t * 2200, t) * 0.35;
      },
      tone(1174.66, 0.12, 0.45, 0.85, 0.002, 0.1),
    ),
  },
  {
    file: "13-manifestation-pulse.wav",
    label: "Manifestation Pulse",
    duration: 0.8,
    mix: mix(
      (t) => {
        const e = envADSR(t, 0.01, 0.08, 0.2, 0.35, 0.8);
        return e * sine(220, t) * 0.35;
      },
      tone(880, 0.05, 0.55, 0.8, 0.004, 0.12),
    ),
  },
  {
    file: "14-dawn-chime.wav",
    label: "Dawn Chime",
    duration: 1.2,
    mix: mix(
      tone(523.25, 0, 0.55, 0.55, 0.005, 0.1),
      tone(659.25, 0.1, 0.55, 0.6, 0.005, 0.1),
      tone(783.99, 0.2, 0.75, 0.75, 0.005, 0.12),
    ),
  },
  {
    file: "15-portal-open.wav",
    label: "Portal Open",
    duration: 0.9,
    mix: mix(
      (t) => {
        if (t > 0.4) return 0;
        const e = 1 - t / 0.4;
        return e * sine(300 + t * 2400, t) * 0.3;
      },
      fmBell(987.77, 0.22, 0.65, 0.9),
    ),
  },
];

mkdirSync(OUT_DIR, { recursive: true });

const manifest = SOUNDS.map(({ file, label, duration }) => ({ file, label, duration }));

for (const sound of SOUNDS) {
  const samples = render(sound.duration, sound.mix);
  writeWav(join(OUT_DIR, sound.file), samples);
}

writeFileSync(
  join(OUT_DIR, "README.txt"),
  [
    "Manifestation routine — notification sound options (original synthesized)",
    "Vibe: magical / mystical / dreamy · quick push length (~0.65–1.2s)",
    "",
    "iOS (OneSignal): add chosen .wav to Xcode app target; reference filename in push payload.",
    "Android: place in res/raw/ (lowercase, no dashes) or use OneSignal bundled sound.",
    "",
    "Files:",
    ...manifest.map((s, i) => `${String(i + 1).padStart(2, "0")}. ${s.label} — ${s.file} (${s.duration}s)`),
    "",
    "Regenerate: node scripts/generate-manifestation-notification-sounds.mjs",
  ].join("\n"),
);

console.log(`Wrote ${SOUNDS.length} sounds to ${OUT_DIR}`);
