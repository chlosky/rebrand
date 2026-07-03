// Generate fireplace sound using Mirror Mode methodology
// Looping buffers with biquad filters, realistic crackles and pops
// Run with: node scripts/generateFireplace.js

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

function applyBandpassFilter(data, sampleRate, centerFreq, Q = 1.0) {
  const w0 = 2 * Math.PI * centerFreq / sampleRate;
  const cosw0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  
  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
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

function generateFireplace() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Step 1: Create 2-second white noise buffer (Mirror Mode methodology)
  const bufferLength = SAMPLE_RATE * 2; // 2 seconds
  const twoSecBuffer = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    twoSecBuffer[i] = (Math.random() * 2 - 1) * 0.25;
  }

  // Step 2: Create base fire rumble (low frequency filtered noise)
  const fireRumble = applyLowpassFilter(twoSecBuffer, SAMPLE_RATE, 400, 0.7);

  // Step 3: Create mid-frequency crackle layer
  const crackleNoise = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    crackleNoise[i] = (Math.random() * 2 - 1) * 0.15;
  }
  const crackleFiltered = applyBandpassFilter(crackleNoise, SAMPLE_RATE, 2000, 1.5);

  // Step 4: Build the 60-second fireplace sound
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base fire rumble (loop the 2-second buffer with 0.18 gain)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = fireRumble[bufferIndex] * 0.18;
      
      // Add continuous crackle layer (quieter)
      data[i] += crackleFiltered[bufferIndex] * 0.08;
    }
    
    // Add occasional pops/crackles (every 0.3-1.2 seconds)
    let currentTime = 0.3 + Math.random() * 0.9;
    while (currentTime < DURATION) {
      const popStart = Math.floor(currentTime * SAMPLE_RATE);
      const popDuration = 0.08 + Math.random() * 0.12; // 80-200ms pops
      const popLength = Math.floor(popDuration * SAMPLE_RATE);
      const popIntensity = 0.15 + Math.random() * 0.25; // Varying intensity 0.15-0.4
      
      // Create sharp pop with quick decay
      for (let i = 0; i < popLength && popStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const bufferIndex = (popStart + i) % bufferLength;
        
        // Sharp attack, exponential decay
        const attack = Math.min(1.0, t / 0.003); // 3ms attack
        const decay = Math.exp(-t * 25); // Fast decay
        const envelope = attack * decay * popIntensity;
        
        // Use bandpass-filtered noise for pop (higher frequency for snap)
        const popNoise = (Math.random() * 2 - 1);
        // Simple inline bandpass around 3000 Hz for snap
        data[popStart + i] += popNoise * envelope;
      }
      
      currentTime += 0.3 + Math.random() * 0.9;
    }
    
    // Add occasional larger wood cracks (every 4-8 seconds)
    let crackTime = 4 + Math.random() * 4;
    while (crackTime < DURATION) {
      const crackStart = Math.floor(crackTime * SAMPLE_RATE);
      const crackDuration = 0.15 + Math.random() * 0.1; // 150-250ms
      const crackLength = Math.floor(crackDuration * SAMPLE_RATE);
      const crackIntensity = 0.3 + Math.random() * 0.2; // 0.3-0.5
      
      for (let i = 0; i < crackLength && crackStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const bufferIndex = (crackStart + i) % bufferLength;
        
        // Medium attack, medium decay
        const attack = Math.min(1.0, t / 0.01); // 10ms attack
        const decay = Math.exp(-t * 12); // Medium decay
        const envelope = attack * decay * crackIntensity;
        
        // Mix of low and mid frequencies for wood crack
        const lowCrack = fireRumble[bufferIndex] * envelope * 0.7;
        const midCrack = crackleFiltered[bufferIndex] * envelope * 0.3;
        
        data[crackStart + i] += lowCrack + midCrack;
      }
      
      crackTime += 4 + Math.random() * 4;
    }
  }

  writeWavFile('fireplace_v2.wav', channels);
}

console.log('Generating fireplace sound (Mirror Mode methodology)...\n');
generateFireplace();
console.log('\n✓ Fireplace generated using Mirror Mode methodology!');
console.log('- 2-second looping noise buffer');
console.log('- Base fire rumble: 400 Hz lowpass, 0.18 gain');
console.log('- Continuous crackle: 2000 Hz bandpass, 0.08 gain');
console.log('- Occasional pops: every 0.3-1.2 seconds (short, sharp)');
console.log('- Wood cracks: every 4-8 seconds (longer, deeper)');
console.log(`\nOutput directory: ${outputDir}`);

























