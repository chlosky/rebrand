// V3: Exact replication of Mirror Mode audio algorithms
// Run with: node scripts/generateSoundsV3.js

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

// Simple biquad lowpass filter implementation
function applyLowpassFilter(data, sampleRate, cutoffFreq, Q = 1.0) {
  // Biquad lowpass coefficients
  const w0 = 2 * Math.PI * cutoffFreq / sampleRate;
  const cosw0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  
  const b0 = (1 - cosw0) / 2;
  const b1 = 1 - cosw0;
  const b2 = (1 - cosw0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw0;
  const a2 = 1 - alpha;
  
  // Normalize
  const b0n = b0 / a0;
  const b1n = b1 / a0;
  const b2n = b2 / a0;
  const a1n = a1 / a0;
  const a2n = a2 / a0;
  
  // Apply filter
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

// RAIN V3 - Exact Mirror Mode implementation
function generateRainV3() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    // 1. Generate white noise at 0.32 volume (exact from mirror mode)
    const noise = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      noise[i] = (Math.random() * 2 - 1) * 0.32;
    }
    
    // 2. Apply lowpass filter at 1400 Hz (exact from mirror mode)
    const filtered = applyLowpassFilter(noise, SAMPLE_RATE, 1400, 1.0);
    
    // 3. Apply gain of 0.14 (exact from mirror mode)
    for (let i = 0; i < length; i++) {
      channels[ch][i] = filtered[i] * 0.14;
    }
    
    // 4. Add occasional thunder (every 3.4-7.6 seconds like mirror mode)
    let currentTime = 3.4 + Math.random() * 4.2;
    while (currentTime < DURATION) {
      const thunderStart = Math.floor(currentTime * SAMPLE_RATE);
      const thunderDuration = 2.1 + Math.random() * 0.7; // 2.1-2.8 seconds
      const thunderLength = Math.floor(thunderDuration * SAMPLE_RATE);
      const peakGain = 0.24 + Math.random() * 0.1; // 0.24-0.34
      
      // Generate thunder noise (same white noise, lowpass at 260 Hz)
      const thunderNoise = new Float32Array(thunderLength);
      for (let i = 0; i < thunderLength; i++) {
        thunderNoise[i] = (Math.random() * 2 - 1) * 0.32;
      }
      const thunderFiltered = applyLowpassFilter(thunderNoise, SAMPLE_RATE, 260, 1.0);
      
      // Apply envelope: linear ramp up over 0.08s, exponential decay
      for (let i = 0; i < thunderLength && thunderStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        let envelope;
        if (t < 0.08) {
          // Linear ramp to peak
          envelope = (t / 0.08) * peakGain;
        } else {
          // Exponential decay from peak to 0.0008
          const decayTime = t - 0.08;
          const totalDecay = thunderDuration - 0.08;
          envelope = peakGain * Math.pow(0.0008 / peakGain, decayTime / totalDecay);
        }
        channels[ch][thunderStart + i] += thunderFiltered[i] * envelope;
      }
      
      currentTime += 3.4 + Math.random() * 4.2;
    }
  }

  writeWavFile('rain_v3.wav', channels);
}

// NATURE PARK V2 - Exact Mirror Mode gold-sparks-overlay implementation
function generateNatureParkV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    // 1. Generate pink noise for wind (exact algorithm from mirror mode line 664-668)
    const wind = new Float32Array(length);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      wind[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = wind[i];
    }
    
    // 2. Apply lowpass filter at 900 Hz with Q=0.7 (exact from mirror mode)
    const windFiltered = applyLowpassFilter(wind, SAMPLE_RATE, 900, 0.7);
    
    // 3. Apply wind gain of 0.18 and master gain of 0.28
    for (let i = 0; i < length; i++) {
      channels[ch][i] = windFiltered[i] * 0.18 * 0.28;
    }
    
    // 4. Add bird chirps (exact from mirror mode lines 690-706)
    // Birds play every 3200-5600ms
    let currentTime = 0;
    while (currentTime < DURATION) {
      const birdStart = Math.floor(currentTime * SAMPLE_RATE);
      const baseFreq = 1200 + Math.random() * 800; // Random 1200-2000 Hz
      
      // Bird chirp: 0.6 seconds total
      const chirpLength = Math.floor(SAMPLE_RATE * 0.6);
      
      for (let i = 0; i < chirpLength && birdStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const now = t;
        
        // Frequency: exponential ramp from base to base*1.8 over 0.25s
        let freq;
        if (t < 0.25) {
          freq = baseFreq * Math.pow(1.8, t / 0.25);
        } else {
          freq = baseFreq * 1.8;
        }
        
        // Gain envelope (exponential ramps)
        let gain;
        if (t < 0.05) {
          // 0.0001 -> 0.08 over 0.05s (exponential)
          gain = 0.0001 * Math.pow(0.08 / 0.0001, t / 0.05);
        } else if (t < 0.5) {
          // 0.08 -> 0.0001 over 0.45s (exponential)
          const decayT = (t - 0.05) / 0.45;
          gain = 0.08 * Math.pow(0.0001 / 0.08, decayT);
        } else {
          gain = 0.0001;
        }
        
        // Generate sine wave
        const phase = 2 * Math.PI * freq * t;
        channels[ch][birdStart + i] += Math.sin(phase) * gain * 0.28; // Apply master gain
      }
      
      currentTime += (3.2 + Math.random() * 2.4); // 3.2-5.6 seconds
    }
  }

  writeWavFile('nature_park_v2.wav', channels);
}

// OCEAN V3 - Better wave simulation with realistic surf
function generateOceanV3() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Create continuous wave motion using overlapping sine waves
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Main wave patterns (long periods for realistic ocean)
      const wave1 = Math.sin(2 * Math.PI * 0.08 * t) * 0.3;  // 12.5 second period
      const wave2 = Math.sin(2 * Math.PI * 0.12 * t) * 0.25; // 8.3 second period
      const wave3 = Math.sin(2 * Math.PI * 0.17 * t) * 0.2;  // 5.9 second period
      
      // Higher frequency for water texture
      const texture = Math.sin(2 * Math.PI * 0.8 * t) * 0.08;
      
      data[i] = wave1 + wave2 + wave3 + texture;
    }
    
    // Add filtered noise for water sound
    const noise = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      noise[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noiseFiltered = applyLowpassFilter(noise, SAMPLE_RATE, 2000, 0.7);
    
    for (let i = 0; i < length; i++) {
      data[i] += noiseFiltered[i];
    }
    
    // Apply smoothing for natural flow
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.7 + data[i - 1] * 0.3;
      }
    }
    
    // Add wave crashes every 6-10 seconds
    let crashTime = 6 + Math.random() * 4;
    while (crashTime < DURATION) {
      const crashStart = Math.floor(crashTime * SAMPLE_RATE);
      const crashLength = Math.floor(SAMPLE_RATE * 2.5); // 2.5 second crash
      
      for (let i = 0; i < crashLength && crashStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        // Crash envelope: quick attack, medium decay
        const attack = Math.min(1.0, t / 0.15); // 150ms attack
        const decay = Math.exp(-t * 1.2); // Exponential decay
        const envelope = attack * decay * 0.25;
        
        // Crash is mostly noise
        const crash = (Math.random() * 2 - 1) * envelope;
        data[crashStart + i] += crash;
      }
      
      crashTime += 6 + Math.random() * 4;
    }
  }

  writeWavFile('ocean_v3.wav', channels);
}

console.log('Generating V3 sounds (exact Mirror Mode replication)...\n');
generateRainV3();
generateNatureParkV2();
generateOceanV3();
console.log('\n✓ All V3 sounds generated successfully!');
console.log('Rain: Exact mirror mode (white noise → 1400Hz lowpass → 0.14 gain + thunder)');
console.log('Nature Park: Exact mirror mode (pink noise wind → 900Hz lowpass + chirping birds)');
console.log('Ocean: Improved wave simulation with realistic surf crashes');
console.log(`\nOutput directory: ${outputDir}`);

























