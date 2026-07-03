// Generate realistic ocean waves sound (V4)
// Run with: node scripts/generateOceanV4.js

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

function generateOceanV4() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Base continuous wave sound (2-second looping buffer)
  const bufferLength = SAMPLE_RATE * 2;
  const baseNoise = new Float32Array(bufferLength);
  
  // Pink noise for water texture
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    baseNoise[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = baseNoise[i];
  }
  
  // Filter for water texture (not too low, not too high)
  const waterFiltered = applyLowpassFilter(baseNoise, SAMPLE_RATE, 1800, 0.7);

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Continuous water texture/hiss (loop the 2-second buffer)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = waterFiltered[bufferIndex] * 0.15;
    }
    
    // Add slow wave motion (very low frequencies for wave cycles)
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Multiple overlapping slow sine waves for wave movement
      const wave1 = Math.sin(2 * Math.PI * 0.06 * t) * 0.18;  // ~17 second cycle
      const wave2 = Math.sin(2 * Math.PI * 0.09 * t) * 0.15;  // ~11 second cycle
      const wave3 = Math.sin(2 * Math.PI * 0.13 * t) * 0.12;  // ~8 second cycle
      
      data[i] += wave1 + wave2 + wave3;
    }
    
    // Add wave crashes (every 7-12 seconds)
    let crashTime = 5 + Math.random() * 5;
    while (crashTime < DURATION) {
      const crashStart = Math.floor(crashTime * SAMPLE_RATE);
      const crashDuration = 3.0 + Math.random() * 1.5; // 3-4.5 seconds
      const crashLength = Math.floor(crashDuration * SAMPLE_RATE);
      
      for (let i = 0; i < crashLength && crashStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / crashDuration;
        
        // Wave crash envelope: quick rise, slow decay
        let envelope;
        if (progress < 0.15) {
          // Wave building
          envelope = progress / 0.15 * 0.25;
        } else {
          // Wave crashing and receding
          envelope = 0.25 * Math.exp(-(progress - 0.15) * 2.5);
        }
        
        // Crash is mostly filtered noise (foam/spray)
        const crash = (Math.random() * 2 - 1) * envelope;
        data[crashStart + i] += crash;
      }
      
      crashTime += 7 + Math.random() * 5;
    }
    
    // Add gentle surf rhythm (smaller waves between crashes)
    let surfTime = 2;
    while (surfTime < DURATION) {
      const surfStart = Math.floor(surfTime * SAMPLE_RATE);
      const surfDuration = 2.0 + Math.random() * 1.0;
      const surfLength = Math.floor(surfDuration * SAMPLE_RATE);
      
      for (let i = 0; i < surfLength && surfStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / surfDuration;
        
        // Gentler envelope
        const envelope = Math.sin(Math.PI * progress) * 0.08;
        const surf = (Math.random() * 2 - 1) * envelope;
        data[surfStart + i] += surf;
      }
      
      surfTime += 4 + Math.random() * 3;
    }
    
    // Apply smoothing for natural flow (multiple passes)
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.75 + data[i - 1] * 0.25;
      }
    }
  }

  writeWavFile('ocean_v4.wav', channels);
}

console.log('Generating realistic ocean waves (V4)...\n');
generateOceanV4();
console.log('\n✓ Ocean V4 generated!');
console.log('- Continuous water texture: Pink noise → 1800Hz lowpass, 0.15 gain');
console.log('- Slow wave cycles: 0.06, 0.09, 0.13 Hz (8-17 second periods)');
console.log('- Wave crashes: Every 7-12s, 3-4.5s duration with buildup and decay');
console.log('- Gentle surf: Every 4-7s between crashes');
console.log('- Heavy smoothing for natural flowing sound');
console.log(`\nOutput directory: ${outputDir}`);

























