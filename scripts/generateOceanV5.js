// Generate realistic ocean waves V5
// More constant waves, enhanced realism, stereo separation
// Run with: node scripts/generateOceanV5.js

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

function generateOceanV5() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Generate high-quality continuous water texture for EACH channel separately
  const bufferLength = SAMPLE_RATE * 3; // 3-second buffer for more variety
  
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Create unique water texture for this channel (stereo separation)
    const waterNoise = new Float32Array(bufferLength);
    let lastOut = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      waterNoise[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = waterNoise[i];
    }
    
    // Filter for realistic water texture (not too muffled, not too bright)
    const waterFiltered = applyLowpassFilter(waterNoise, SAMPLE_RATE, 2200, 0.8);
    
    // Continuous water texture (loop the buffer)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      // Slightly different volume per channel for stereo width
      const channelGain = ch === 0 ? 0.18 : 0.16;
      data[i] = waterFiltered[bufferIndex] * channelGain;
    }
    
    // Continuous wave motion - ALWAYS present, overlapping waves
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Primary wave cycles (slightly different per channel for stereo)
      const offset = ch * 0.3; // Phase offset for stereo
      const wave1 = Math.sin(2 * Math.PI * 0.07 * t + offset) * 0.16;
      const wave2 = Math.sin(2 * Math.PI * 0.11 * t + offset) * 0.14;
      const wave3 = Math.sin(2 * Math.PI * 0.16 * t + offset) * 0.11;
      const wave4 = Math.sin(2 * Math.PI * 0.23 * t + offset) * 0.09; // Additional wave for fullness
      
      data[i] += wave1 + wave2 + wave3 + wave4;
    }
    
    // Regular wave crashes - MORE CONSISTENT timing (every 8-11 seconds, tighter range)
    const crashOffset = ch * 1.5; // Different timing per channel
    let crashTime = 4 + crashOffset;
    while (crashTime < DURATION) {
      const crashStart = Math.floor(crashTime * SAMPLE_RATE);
      const crashDuration = 3.5 + Math.random() * 1.0; // 3.5-4.5 seconds
      const crashLength = Math.floor(crashDuration * SAMPLE_RATE);
      
      for (let i = 0; i < crashLength && crashStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / crashDuration;
        
        // Realistic wave crash envelope
        let envelope;
        if (progress < 0.12) {
          // Wave building
          envelope = Math.pow(progress / 0.12, 1.5) * 0.28;
        } else if (progress < 0.35) {
          // Peak/crash
          envelope = 0.28;
        } else {
          // Receding
          envelope = 0.28 * Math.exp(-(progress - 0.35) * 2.8);
        }
        
        // High-quality crash sound (layered noise)
        const crash = (Math.random() * 2 - 1) * envelope;
        data[crashStart + i] += crash;
      }
      
      crashTime += 8.5 + Math.random() * 2.5; // Consistent 8.5-11 second spacing
    }
    
    // Continuous smaller surf (fills gaps, creates constant wave feeling)
    let surfTime = 1.5 + ch * 0.8;
    while (surfTime < DURATION) {
      const surfStart = Math.floor(surfTime * SAMPLE_RATE);
      const surfDuration = 2.5 + Math.random() * 1.0;
      const surfLength = Math.floor(surfDuration * SAMPLE_RATE);
      
      for (let i = 0; i < surfLength && surfStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / surfDuration;
        
        // Gentle surf envelope
        const envelope = Math.sin(Math.PI * progress) * 0.10;
        const surf = (Math.random() * 2 - 1) * envelope;
        data[surfStart + i] += surf;
      }
      
      surfTime += 4.5 + Math.random() * 2; // Overlapping surf sounds
    }
    
    // Add subtle foam/bubbles texture (continuous)
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      // High-frequency texture for realism
      const bubbles = Math.sin(2 * Math.PI * (1200 + Math.sin(t * 3) * 200) * t) * 0.015;
      data[i] += bubbles * (Math.random() * 0.4 + 0.6);
    }
    
    // Multi-pass smoothing for natural flow
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.70 + data[i - 1] * 0.30;
      }
    }
  }

  writeWavFile('ocean_v5.wav', channels);
}

console.log('Generating ocean waves V5 (constant, realistic, stereo)...\n');
generateOceanV5();
console.log('\n✓ Ocean V5 generated!');
console.log('Enhanced features:');
console.log('- ✓ Separate water texture per channel (3-second buffers)');
console.log('- ✓ 4 overlapping wave cycles for constant motion');
console.log('- ✓ More consistent crashes: every 8.5-11s (was 7-12s)');
console.log('- ✓ Continuous smaller surf filling gaps');
console.log('- ✓ High-frequency bubble texture for realism');
console.log('- ✓ Stereo separation: different timing and phase per channel');
console.log('- ✓ Enhanced smoothing (4 passes) for natural flow');
console.log('- ✓ Better quality filtering (2200Hz vs 1800Hz)');
console.log(`\nOutput directory: ${outputDir}`);

























