// Generate brighter, livelier cityscape sound (V2)
// Remove sirens, increase volume, less creepy
// Run with: node scripts/generateCityscapeV2.js

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

function generateCityscapeV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Base ambient city rumble (2-second looping buffer) - BRIGHTER
  const bufferLength = SAMPLE_RATE * 2;
  const cityRumble = new Float32Array(bufferLength);
  
  // Use pink noise for city rumble
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    cityRumble[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = cityRumble[i];
  }
  
  // Apply higher lowpass cutoff for brighter sound (1000 Hz instead of 600 Hz)
  const rumbleFiltered = applyLowpassFilter(cityRumble, SAMPLE_RATE, 1000, 0.8);

  // Build the cityscape
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base city rumble - LOUDER (0.22 instead of 0.12)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = rumbleFiltered[bufferIndex] * 0.22;
    }
    
    // Add frequent car passes (every 2-5 seconds, more frequent)
    let carTime = 1 + Math.random() * 2;
    while (carTime < DURATION) {
      const carStart = Math.floor(carTime * SAMPLE_RATE);
      const carDuration = 1.5 + Math.random() * 1.0; // 1.5-2.5 seconds (shorter, peppier)
      const carLength = Math.floor(carDuration * SAMPLE_RATE);
      
      for (let i = 0; i < carLength && carStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / carDuration;
        
        // Doppler effect - HIGHER frequencies (less creepy)
        const baseFreq = 150; // Higher than 120
        const freq = baseFreq * (1.25 - progress * 0.5); // 187 Hz → 112 Hz
        
        // Volume envelope
        let envelope;
        if (progress < 0.3) {
          envelope = progress / 0.3 * 0.12; // LOUDER (0.12 instead of 0.08)
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.12;
        } else {
          envelope = 0.12;
        }
        
        // Car sound with more texture
        const rumble = Math.sin(2 * Math.PI * freq * t);
        const texture = (Math.random() * 2 - 1) * 0.25;
        
        data[carStart + i] += (rumble * 0.6 + texture * 0.4) * envelope;
      }
      
      carTime += 2 + Math.random() * 3; // More frequent
    }
    
    // Add occasional bus/truck passes (every 12-20 seconds) - deeper rumble
    let truckTime = 10 + Math.random() * 8;
    while (truckTime < DURATION) {
      const truckStart = Math.floor(truckTime * SAMPLE_RATE);
      const truckDuration = 2.5 + Math.random() * 1.0;
      const truckLength = Math.floor(truckDuration * SAMPLE_RATE);
      
      for (let i = 0; i < truckLength && truckStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / truckDuration;
        
        const baseFreq = 80; // Lower for truck
        const freq = baseFreq * (1.2 - progress * 0.4);
        
        let envelope;
        if (progress < 0.4) {
          envelope = progress / 0.4 * 0.15;
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.15;
        } else {
          envelope = 0.15;
        }
        
        data[truckStart + i] += Math.sin(2 * Math.PI * freq * t) * envelope;
      }
      
      truckTime += 12 + Math.random() * 8;
    }
    
    // Horn honks (every 6-12 seconds) - LOUDER, BRIGHTER
    let honkTime = 4 + Math.random() * 6;
    while (honkTime < DURATION) {
      const honkStart = Math.floor(honkTime * SAMPLE_RATE);
      const honkDuration = 0.25 + Math.random() * 0.35; // 0.25-0.6 seconds
      const honkLength = Math.floor(honkDuration * SAMPLE_RATE);
      const honkFreq = 350 + Math.random() * 250; // 350-600 Hz (higher, brighter)
      
      for (let i = 0; i < honkLength && honkStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / honkDuration) * 0.10; // LOUDER (0.10 instead of 0.05)
        data[honkStart + i] += Math.sin(2 * Math.PI * honkFreq * t) * envelope;
      }
      
      honkTime += 6 + Math.random() * 6;
    }
    
    // Add people/crowd ambience (very subtle voices/chatter)
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      // Mid-frequency chatter simulation
      const chatter = Math.sin(2 * Math.PI * (800 + Math.random() * 400) * t) * 0.01;
      data[i] += chatter * (Math.random() * 0.5 + 0.5); // Random amplitude
    }
    
    // Distant construction/activity sounds (occasional)
    let constructionTime = 8 + Math.random() * 10;
    while (constructionTime < DURATION) {
      const conStart = Math.floor(constructionTime * SAMPLE_RATE);
      const conLength = Math.floor(SAMPLE_RATE * 1.5);
      
      for (let i = 0; i < conLength && conStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / 1.5) * 0.06;
        // Rhythmic construction noise
        const rhythm = Math.sin(2 * Math.PI * 3 * t); // 3 Hz rhythm
        const noise = (Math.random() * 2 - 1) * 0.5;
        data[conStart + i] += (rhythm * 0.5 + noise * 0.5) * envelope;
      }
      
      constructionTime += 15 + Math.random() * 15;
    }
  }

  writeWavFile('cityscape_v2.wav', channels);
}

console.log('Generating brighter cityscape (V2)...\n');
generateCityscapeV2();
console.log('\n✓ Cityscape V2 generated!');
console.log('Changes from V1:');
console.log('- ✓ Removed sirens (too creepy)');
console.log('- ✓ Increased volume: Base rumble 0.22 (was 0.12), cars 0.12 (was 0.08)');
console.log('- ✓ Brighter sound: 1000Hz lowpass (was 600Hz)');
console.log('- ✓ Higher car frequencies: 150Hz base (was 120Hz)');
console.log('- ✓ More frequent cars: every 2-5s (was 3-7s)');
console.log('- ✓ Louder horn honks: 0.10 (was 0.05), higher pitch 350-600Hz');
console.log('- ✓ Added: People/crowd chatter, construction sounds');
console.log('- ✓ Added: Bus/truck passes for variety');
console.log(`\nOutput directory: ${outputDir}`);

























