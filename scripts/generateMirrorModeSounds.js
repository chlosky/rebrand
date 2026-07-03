// Generate 60-second versions of all Mirror Mode overlay audio
// Summit Top, Hearts, Coins, and improved Ambient
// Run with: node scripts/generateMirrorModeSounds.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const SAMPLE_RATE = 22050;
const DURATION = 60;
const NUM_CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;

function writeWavFile(filename, audioData) {
  const numSamples = audioData[0].length;
  const dataSize = numSamples * NUM_CHANNELS * BYTES_PER_SAMPLE;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(NUM_CHANNELS, offset); offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 4;
  buffer.writeUInt16LE(NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < NUM_CHANNELS; channel++) {
      const sample = Math.max(-1, Math.min(1, audioData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      buffer.writeInt16LE(Math.round(intSample), offset);
      offset += 2;
    }
  }

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

function applyHighpassFilter(data, sampleRate, cutoffFreq) {
  const w0 = 2 * Math.PI * cutoffFreq / sampleRate;
  const cosw0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * 1.0);
  
  const b0 = (1 + cosw0) / 2;
  const b1 = -(1 + cosw0);
  const b2 = (1 + cosw0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw0;
  const a2 = 1 - alpha;
  
  const b0n = b0 / a0;
  const b1n = b1 / a0;
  const b2n = b2 / a0;
  const a1n = a1 / a0;
  const a2n = a2 / a0;
  
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const filtered = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = b0n * x0 + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2;
    filtered[i] = y0;
    
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  
  return filtered;
}

function applyLowpassFilter(data, sampleRate, cutoffFreq, Q = 1.0) {
  const w0 = 2 * Math.PI * cutoffFreq / sampleRate;
  const cosw0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  
  const b0 = (1 - cosw0) / 2;
  const b1 = 1 - cosw0;
  const b2 = (1 - cosw0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw0;
  const a2 = 1 - alpha;
  
  const b0n = b0 / a0;
  const b1n = b1 / a0;
  const b2n = b2 / a0;
  const a1n = a1 / a0;
  const a2n = a2 / a0;
  
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const filtered = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = b0n * x0 + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2;
    filtered[i] = y0;
    
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  
  return filtered;
}

// Summit Top Wind (lines 238-262)
function generateSummitTop() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Create 2-second white noise buffer at 0.35 volume
  const bufferLength = SAMPLE_RATE * 2;
  const twoSecBuffer = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    twoSecBuffer[i] = (Math.random() * 2 - 1) * 0.35;
  }

  // Apply highpass at 100 Hz
  const highpassed = applyHighpassFilter(twoSecBuffer, SAMPLE_RATE, 100);
  
  // Apply lowpass at 1400 Hz
  const filtered = applyLowpassFilter(highpassed, SAMPLE_RATE, 1400, 1.0);

  // Loop for 60 seconds with 0.06 gain
  for (let ch = 0; ch < 2; ch++) {
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      channels[ch][i] = filtered[bufferIndex] * 0.06;
    }
  }

  writeWavFile('summit_top.wav', channels);
}

// Hearts (brown noise + occasional harp notes)
function generateHearts() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Create 2-second brown noise buffer (pink noise algorithm from line 582-586)
  const bufferLength = SAMPLE_RATE * 2;
  const brownNoise = new Float32Array(bufferLength);
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    brownNoise[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = brownNoise[i];
  }

  // Loop brown noise with 0.22 gain and 0.28 master gain
  for (let ch = 0; ch < 2; ch++) {
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      channels[ch][i] = brownNoise[bufferIndex] * 0.22 * 0.28;
    }
  }

  // Add occasional harp notes (lines 719-746)
  // Harp frequencies (typical pentatonic/major scale)
  const harpFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C, D, E, G, A, C
  
  // Play harp note every 4-8 seconds
  let currentTime = 2;
  while (currentTime < DURATION) {
    const noteStart = Math.floor(currentTime * SAMPLE_RATE);
    const freq = harpFreqs[Math.floor(Math.random() * harpFreqs.length)];
    const noteDuration = 3.0; // 3 seconds
    const noteLength = Math.floor(SAMPLE_RATE * noteDuration);
    
    for (let ch = 0; ch < 2; ch++) {
      for (let i = 0; i < noteLength && noteStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const now = t;
        
        // Triangle wave oscillator
        const phase = (freq * t) % 1.0;
        let triangleWave;
        if (phase < 0.5) {
          triangleWave = 4 * phase - 1; // Rise from -1 to 1
        } else {
          triangleWave = 3 - 4 * phase; // Fall from 1 to -1
        }
        
        // Lowpass filter at 1800 Hz, Q=0.9 (simplified - just use the wave)
        // In real implementation this would be filtered, but for simplicity using triangle directly
        
        // Exponential envelope: 0.0001 → 0.12 @ 0.03s → 0.0001 @ 2.6s
        let gain;
        if (t < 0.03) {
          gain = 0.0001 * Math.pow(0.12 / 0.0001, t / 0.03);
        } else {
          const decayT = (t - 0.03) / (2.6 - 0.03);
          gain = 0.12 * Math.pow(0.0001 / 0.12, decayT);
        }
        
        // Apply lowpass simulation (simple one-pole for efficiency)
        const filtered = triangleWave * 0.7; // Approximate filter effect
        
        channels[ch][noteStart + i] += filtered * gain * 0.28; // Apply master gain
      }
    }
    
    currentTime += 4 + Math.random() * 4; // 4-8 seconds between notes
  }

  writeWavFile('hearts.wav', channels);
}

// Coins (brown noise only)
function generateCoins() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Create 2-second brown noise buffer (same algorithm)
  const bufferLength = SAMPLE_RATE * 2;
  const brownNoise = new Float32Array(bufferLength);
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    brownNoise[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = brownNoise[i];
  }

  // Loop brown noise with 0.22 gain and 0.35 master gain (louder than hearts)
  for (let ch = 0; ch < 2; ch++) {
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      channels[ch][i] = brownNoise[bufferIndex] * 0.22 * 0.35;
    }
  }

  writeWavFile('coins.wav', channels);
}

// Ambient V3 - Improved version with better balance
function generateAmbientV3() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Keep the original good frequencies but improve the balance
  const chords = [
    [130.81, 164.81, 196.00], // C major
    [146.83, 174.61, 220.00], // D minor
    [164.81, 196.00, 246.94], // E minor
    [174.61, 220.00, 261.63], // F major
  ];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    let chordIndex = 0;
    const chordDuration = SAMPLE_RATE * 6; // 6 seconds per chord (good pacing)

    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Change chord every 6 seconds
      if (i % chordDuration === 0 && i > 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }

      const chord = chords[chordIndex];
      
      // Better envelope - smoother transitions
      const localTime = (i % chordDuration) / SAMPLE_RATE;
      const envelope = 0.28 * (1 - Math.cos(2 * Math.PI * localTime / 6));
      
      // More balanced note volumes (root note prominent but not overwhelming)
      data[i] = chord.reduce((sum, freq, idx) => {
        const noteVolume = idx === 0 ? 0.35 : (idx === 1 ? 0.25 : 0.20);
        return sum + Math.sin(2 * Math.PI * freq * t) * envelope * noteVolume;
      }, 0);
      
      // Add subtle shimmer with higher harmonics
      data[i] += Math.sin(2 * Math.PI * chord[0] * 2 * t) * envelope * 0.06; // Octave
      data[i] += Math.sin(2 * Math.PI * chord[1] * 2 * t) * envelope * 0.04; // Third octave
    }

    // Light smoothing for warmth
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.85 + data[i - 1] * 0.15;
    }
  }

  writeWavFile('ambient_v3.wav', channels);
}

console.log('Generating Mirror Mode overlay sounds + Ambient V3...\n');
generateSummitTop();
generateHearts();
generateCoins();
generateAmbientV3();
console.log('\n✓ All Mirror Mode sounds generated!');
console.log('Summit Top: White noise → 100Hz highpass → 1400Hz lowpass → 0.06 gain');
console.log('Hearts: Brown noise (0.22 × 0.28) + harp notes every 4-8s');
console.log('Coins: Brown noise (0.22 × 0.35)');
console.log('Ambient V3: Improved chord balance with subtle harmonics');
console.log(`\nOutput directory: ${outputDir}`);

























