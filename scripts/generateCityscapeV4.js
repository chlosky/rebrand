// Generate cityscape V4 - Minimal wind, no weird construction sounds
// Run with: node scripts/generateCityscapeV4.js

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

function generateCityscapeV4() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Base ambient city rumble - MUCH QUIETER (10% of v3)
  const bufferLength = SAMPLE_RATE * 2;
  const cityRumble = new Float32Array(bufferLength);
  
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    cityRumble[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = cityRumble[i];
  }
  
  const rumbleFiltered = applyLowpassFilter(cityRumble, SAMPLE_RATE, 1000, 0.8);

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base city rumble - REDUCED TO 10% (was 0.22, now 0.022)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = rumbleFiltered[bufferIndex] * 0.022;
    }
    
    // Car passes (every 2-5 seconds)
    let carTime = 1 + Math.random() * 2;
    while (carTime < DURATION) {
      const carStart = Math.floor(carTime * SAMPLE_RATE);
      const carDuration = 1.5 + Math.random() * 1.0;
      const carLength = Math.floor(carDuration * SAMPLE_RATE);
      
      for (let i = 0; i < carLength && carStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / carDuration;
        
        const baseFreq = 150;
        const freq = baseFreq * (1.25 - progress * 0.5);
        
        let envelope;
        if (progress < 0.3) {
          envelope = progress / 0.3 * 0.12;
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.12;
        } else {
          envelope = 0.12;
        }
        
        const rumble = Math.sin(2 * Math.PI * freq * t);
        const texture = (Math.random() * 2 - 1) * 0.25;
        
        data[carStart + i] += (rumble * 0.6 + texture * 0.4) * envelope;
      }
      
      carTime += 2 + Math.random() * 3;
    }
    
    // Bus/truck passes (every 12-20 seconds)
    let truckTime = 10 + Math.random() * 8;
    while (truckTime < DURATION) {
      const truckStart = Math.floor(truckTime * SAMPLE_RATE);
      const truckDuration = 2.5 + Math.random() * 1.0;
      const truckLength = Math.floor(truckDuration * SAMPLE_RATE);
      
      for (let i = 0; i < truckLength && truckStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / truckDuration;
        
        const baseFreq = 80;
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
    
    // Louder continuous train rumble
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      const clatterFreq = 2.2 + Math.sin(t * 0.2) * 0.4;
      const clatter = Math.sin(2 * Math.PI * clatterFreq * t);
      const trainRumble = clatter * 0.035 + Math.sin(2 * Math.PI * clatterFreq * 2 * t) * 0.015;
      data[i] += trainRumble;
    }
    
    // Train horns - every 12-20s
    let trainTime = 10 + Math.random() * 8;
    while (trainTime < DURATION) {
      const trainStart = Math.floor(trainTime * SAMPLE_RATE);
      const trainDuration = 1.5;
      const trainLength = Math.floor(trainDuration * SAMPLE_RATE);
      
      for (let i = 0; i < trainLength && trainStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        
        const freq1 = 220;
        const freq2 = 329.63;
        
        let envelope;
        if (t < 0.1) {
          envelope = t / 0.1 * 0.08;
        } else if (t > 1.2) {
          envelope = (1.5 - t) / 0.3 * 0.08;
        } else {
          envelope = 0.08;
        }
        
        const horn = Math.sin(2 * Math.PI * freq1 * t) * 0.5 + 
                     Math.sin(2 * Math.PI * freq2 * t) * 0.5;
        
        data[trainStart + i] += horn * envelope;
      }
      
      trainTime += 12 + Math.random() * 8;
    }
    
    // Train crossing bells (every 25-40 seconds)
    let bellTime = 20 + Math.random() * 15;
    while (bellTime < DURATION) {
      const bellStart = Math.floor(bellTime * SAMPLE_RATE);
      const bellDuration = 4.0;
      const bellLength = Math.floor(bellDuration * SAMPLE_RATE);
      const bellFreq = 800;
      
      for (let i = 0; i < bellLength && bellStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const beatCycle = (t % 1.5);
        let beatEnvelope = 0;
        
        if (beatCycle < 0.3) {
          beatEnvelope = Math.exp(-(beatCycle) * 12) * 0.05;
        } else if (beatCycle >= 0.4 && beatCycle < 0.7) {
          beatEnvelope = Math.exp(-(beatCycle - 0.4) * 12) * 0.05;
        }
        
        const bell = Math.sin(2 * Math.PI * bellFreq * t) +
                     Math.sin(2 * Math.PI * bellFreq * 2.1 * t) * 0.3;
        
        data[bellStart + i] += bell * beatEnvelope;
      }
      
      bellTime += 25 + Math.random() * 15;
    }
    
    // Train brake screech (occasional, every 30-50 seconds)
    let screechTime = 25 + Math.random() * 20;
    while (screechTime < DURATION) {
      const screechStart = Math.floor(screechTime * SAMPLE_RATE);
      const screechDuration = 1.0 + Math.random() * 0.5;
      const screechLength = Math.floor(screechDuration * SAMPLE_RATE);
      
      for (let i = 0; i < screechLength && screechStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        
        const freq = 800 + Math.sin(t * 30) * 200;
        const envelope = Math.exp(-t * 3) * 0.04;
        const screech = Math.sin(2 * Math.PI * freq * t);
        
        data[screechStart + i] += screech * envelope;
      }
      
      screechTime += 30 + Math.random() * 20;
    }
    
    // Very subtle people chatter
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      const chatter = Math.sin(2 * Math.PI * (800 + Math.random() * 400) * t) * 0.008; // Reduced from 0.01
      data[i] += chatter * (Math.random() * 0.5 + 0.5);
    }
    
    // REMOVED: Construction sounds (these were the weird sounds at 33-39 seconds)
  }

  writeWavFile('cityscape_v4.wav', channels);
}

console.log('Generating cityscape V4 (minimal wind, no construction)...\n');
generateCityscapeV4();
console.log('\n✓ Cityscape V4 generated!');
console.log('Changes from V3:');
console.log('- ✓ Base rumble reduced to 10%: 0.022 (was 0.22)');
console.log('- ✗ Removed construction sounds (weird sounds at 33-39s)');
console.log('- ✓ Reduced people chatter: 0.008 (was 0.01)');
console.log('\nKeeping: Cars, trucks, trains, train horns, crossing bells, brake screeches');
console.log(`\nOutput directory: ${outputDir}`);

























