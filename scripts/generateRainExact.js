// Generate exact 1-minute version of Mirror Mode rain/thunder
// Loops 2-second buffer 30 times, just like Mirror Mode does
// Run with: node scripts/generateRainExact.js

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

function generateMirrorModeRain() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Step 1: Create 2-second white noise buffer (like Mirror Mode line 2749-2751)
  const bufferLength = SAMPLE_RATE * 2; // 2 seconds
  const twoSecBuffer = new Float32Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    twoSecBuffer[i] = (Math.random() * 2 - 1) * 0.32;
  }

  // Step 2: Apply 1400 Hz lowpass filter (like Mirror Mode line 2755-2757)
  const rainFiltered = applyLowpassFilter(twoSecBuffer, SAMPLE_RATE, 1400, 1.0);

  // Step 3: Apply 260 Hz lowpass for thunder (same buffer, different filter)
  const thunderFiltered = applyLowpassFilter(twoSecBuffer, SAMPLE_RATE, 260, 1.0);

  // Step 4: Loop the 2-second buffer for 60 seconds (30 repeats)
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Rain layer: loop 2-second filtered buffer with 0.14 gain
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength; // Loop the 2-second buffer
      data[i] = rainFiltered[bufferIndex] * 0.14;
    }
    
    // Thunder layer: occasional rumbles (every 3.4-7.6 seconds)
    let currentTime = 3.4 + Math.random() * 4.2;
    while (currentTime < DURATION) {
      const thunderStart = Math.floor(currentTime * SAMPLE_RATE);
      const thunderDuration = 2.1 + Math.random() * 0.7; // 2.1-2.8 seconds
      const thunderLength = Math.floor(thunderDuration * SAMPLE_RATE);
      const peakGain = 0.24 + Math.random() * 0.1; // 0.24-0.34
      
      // Apply thunder envelope
      for (let i = 0; i < thunderLength && thunderStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const bufferIndex = (thunderStart + i) % bufferLength;
        
        let envelope;
        if (t < 0.08) {
          // Linear ramp to peak over 0.08s
          envelope = (t / 0.08) * peakGain;
        } else {
          // Exponential decay
          const decayTime = t - 0.08;
          const totalDecay = thunderDuration - 0.08;
          envelope = peakGain * Math.pow(0.0008 / peakGain, decayTime / totalDecay);
        }
        
        data[thunderStart + i] += thunderFiltered[bufferIndex] * envelope;
      }
      
      currentTime += 3.4 + Math.random() * 4.2;
    }
  }

  writeWavFile('rain_mirror_mode.wav', channels);
}

console.log('Generating exact Mirror Mode rain (2-second looping buffer)...\n');
generateMirrorModeRain();
console.log('\n✓ Rain generated exactly like Mirror Mode!');
console.log('- 2-second white noise buffer (0.32 volume)');
console.log('- 1400 Hz lowpass filter for rain');
console.log('- 0.14 gain applied');
console.log('- Buffer loops 30 times for 60 seconds');
console.log('- Thunder: 260 Hz lowpass, occasional rumbles every 3.4-7.6s');
console.log(`\nOutput directory: ${outputDir}`);

























