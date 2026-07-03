// Generate realistic coin clinking sounds for 60 seconds
// Run with: node scripts/generateCoinsClinking.js

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

function generateCoinsClinking() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Base ambient coin jingle (2-second looping buffer - brown noise)
  const bufferLength = SAMPLE_RATE * 2;
  const brownNoise = new Float32Array(bufferLength);
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    brownNoise[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = brownNoise[i];
  }

  // Apply lowpass for mellow background
  const bgFiltered = applyLowpassFilter(brownNoise, SAMPLE_RATE, 1200, 0.7);

  // Build the coin sound
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base ambient background (very quiet)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = bgFiltered[bufferIndex] * 0.08;
    }
    
    // Add individual coin clinks (every 0.4-1.2 seconds)
    let clinkTime = 0.2;
    while (clinkTime < DURATION) {
      const clinkStart = Math.floor(clinkTime * SAMPLE_RATE);
      const clinkDuration = 0.6 + Math.random() * 0.4; // 0.6-1.0 seconds
      const clinkLength = Math.floor(clinkDuration * SAMPLE_RATE);
      
      // Metallic coin frequencies (mix of high harmonics)
      const fundamental = 2000 + Math.random() * 1500; // 2000-3500 Hz
      const harmonic2 = fundamental * 2.1; // Slightly inharmonic
      const harmonic3 = fundamental * 3.3;
      const harmonic4 = fundamental * 4.7;
      
      const intensity = 0.12 + Math.random() * 0.08; // 0.12-0.2
      
      for (let i = 0; i < clinkLength && clinkStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        
        // Sharp attack, ringing decay (metallic)
        let envelope;
        if (t < 0.005) {
          // Very sharp attack (5ms)
          envelope = t / 0.005;
        } else {
          // Exponential decay with some wobble (ringing)
          const decay = Math.exp(-t * 4);
          const ring = 1 + Math.sin(t * 60) * 0.1 * decay; // Slight wobble
          envelope = decay * ring;
        }
        
        // Mix of harmonics for metallic sound
        const sound = 
          Math.sin(2 * Math.PI * fundamental * t) * 0.4 +
          Math.sin(2 * Math.PI * harmonic2 * t) * 0.3 +
          Math.sin(2 * Math.PI * harmonic3 * t) * 0.2 +
          Math.sin(2 * Math.PI * harmonic4 * t) * 0.1;
        
        data[clinkStart + i] += sound * envelope * intensity;
      }
      
      clinkTime += 0.4 + Math.random() * 0.8; // 0.4-1.2 seconds between clinks
    }
    
    // Add occasional multiple coin clinks (coin shower - every 5-10 seconds)
    let showerTime = 5 + Math.random() * 5;
    while (showerTime < DURATION) {
      const showerStart = Math.floor(showerTime * SAMPLE_RATE);
      const numCoins = 3 + Math.floor(Math.random() * 5); // 3-7 coins
      
      for (let c = 0; c < numCoins; c++) {
        const coinDelay = c * (0.03 + Math.random() * 0.05); // 30-80ms between each
        const coinStart = showerStart + Math.floor(coinDelay * SAMPLE_RATE);
        const coinDuration = 0.5;
        const coinLength = Math.floor(coinDuration * SAMPLE_RATE);
        
        const fundamental = 2200 + Math.random() * 1200;
        const intensity = 0.08 + Math.random() * 0.05;
        
        for (let i = 0; i < coinLength && coinStart + i < length; i++) {
          const t = i / SAMPLE_RATE;
          
          const envelope = Math.exp(-t * 6) * (t < 0.003 ? t / 0.003 : 1);
          
          const sound = 
            Math.sin(2 * Math.PI * fundamental * t) * 0.5 +
            Math.sin(2 * Math.PI * fundamental * 2.1 * t) * 0.3 +
            Math.sin(2 * Math.PI * fundamental * 3.3 * t) * 0.2;
          
          data[coinStart + i] += sound * envelope * intensity;
        }
      }
      
      showerTime += 5 + Math.random() * 5;
    }
  }

  writeWavFile('coins_clinking.wav', channels);
}

console.log('Generating coin clinking sounds...\n');
generateCoinsClinking();
console.log('\n✓ Coin clinking sound generated!');
console.log('- Base ambient: Brown noise → 1200Hz lowpass, 0.08 gain');
console.log('- Individual clinks: Every 0.4-1.2s, metallic harmonics (2000-3500Hz)');
console.log('- Coin showers: Every 5-10s, 3-7 coins rapid succession');
console.log('- Metallic character: Multiple inharmonic overtones with ringing decay');
console.log(`\nOutput directory: ${outputDir}`);

























