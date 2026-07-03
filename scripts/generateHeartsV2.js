// Generate Hearts V2 - Much louder harp sounds
// Run with: node scripts/generateHeartsV2.js

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

function generateHeartsV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Pentatonic scale frequencies (same as Mirror Mode)
  const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Background brown noise (REDUCED to make harps more prominent)
    let brownLast = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      brownLast = (brownLast + 0.02 * white) / 1.02;
      data[i] = brownLast * 0.15; // Reduced from 0.22 * 0.28 = 0.0616
    }
    
    // Harp plucks - MUCH LOUDER and MORE FREQUENT
    let harpTime = 0.5 + Math.random() * 2;
    while (harpTime < DURATION) {
      const harpStart = Math.floor(harpTime * SAMPLE_RATE);
      const harpFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      const harpDuration = 2.5 + Math.random() * 1.5; // 2.5-4 seconds decay
      const harpLength = Math.floor(harpDuration * SAMPLE_RATE);
      
      // Generate harp note
      const harpBuffer = new Float32Array(harpLength);
      for (let i = 0; i < harpLength; i++) {
        const t = i / SAMPLE_RATE;
        
        // Exponential envelope (pluck decay)
        const envelope = Math.exp(-t * 1.2); // Slightly slower decay
        
        // Triangle wave (harp-like)
        const phase = (harpFreq * t) % 1.0;
        const triangle = phase < 0.5 ? (phase * 4 - 1) : (3 - phase * 4);
        
        harpBuffer[i] = triangle * envelope * 0.35; // MUCH LOUDER: was ~0.08 effective, now 0.35
      }
      
      // Apply lowpass filter (1800 Hz)
      const harpFiltered = applyLowpassFilter(harpBuffer, SAMPLE_RATE, 1800, 0.7);
      
      // Add to data
      for (let i = 0; i < harpLength && harpStart + i < length; i++) {
        data[harpStart + i] += harpFiltered[i];
      }
      
      harpTime += 3 + Math.random() * 4; // Every 3-7 seconds (was 4-8)
    }
  }

  writeWavFile('hearts_v2.wav', channels);
}

console.log('Generating Hearts V2 (much louder harps)...\n');
generateHeartsV2();
console.log('\n✓ Hearts V2 generated!');
console.log('Changes from V1:');
console.log('- ✓ Harp volume: 0.35 (was ~0.08 effective) - 4.3x louder!');
console.log('- ✓ More frequent harps: every 3-7s (was 4-8s)');
console.log('- ✓ Longer harp decay: 2.5-4s (was shorter)');
console.log('- ✓ Reduced brown noise: 0.15 (was 0.0616) but still present');
console.log('\nHarps should be much more prominent now!');
console.log(`\nOutput directory: ${outputDir}`);

























