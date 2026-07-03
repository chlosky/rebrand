// Generate cityscape V5 - No rain sound, much louder
// Run with: node scripts/generateCityscapeV5.js

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

function generateCityscapeV5() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // REMOVED: Base city rumble (this was causing rain-like sound)
    // NO continuous noise whatsoever
    
    // Car passes - MUCH LOUDER (every 2-5 seconds)
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
          envelope = progress / 0.3 * 0.40; // 3.3x louder (was 0.12)
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.40;
        } else {
          envelope = 0.40;
        }
        
        const rumble = Math.sin(2 * Math.PI * freq * t);
        const texture = (Math.random() * 2 - 1) * 0.25;
        
        data[carStart + i] += (rumble * 0.6 + texture * 0.4) * envelope;
      }
      
      carTime += 2 + Math.random() * 3;
    }
    
    // Bus/truck passes - MUCH LOUDER (every 12-20 seconds)
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
          envelope = progress / 0.4 * 0.45; // 3x louder (was 0.15)
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.45;
        } else {
          envelope = 0.45;
        }
        
        data[truckStart + i] += Math.sin(2 * Math.PI * freq * t) * envelope;
      }
      
      truckTime += 12 + Math.random() * 8;
    }
    
    // Train rumble - MUCH LOUDER
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      const clatterFreq = 2.2 + Math.sin(t * 0.2) * 0.4;
      const clatter = Math.sin(2 * Math.PI * clatterFreq * t);
      const trainRumble = clatter * 0.12 + Math.sin(2 * Math.PI * clatterFreq * 2 * t) * 0.05; // 3.4x louder
      data[i] += trainRumble;
    }
    
    // Train horns - MUCH LOUDER (every 12-20s)
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
          envelope = t / 0.1 * 0.25; // 3x louder (was 0.08)
        } else if (t > 1.2) {
          envelope = (1.5 - t) / 0.3 * 0.25;
        } else {
          envelope = 0.25;
        }
        
        const horn = Math.sin(2 * Math.PI * freq1 * t) * 0.5 + 
                     Math.sin(2 * Math.PI * freq2 * t) * 0.5;
        
        data[trainStart + i] += horn * envelope;
      }
      
      trainTime += 12 + Math.random() * 8;
    }
    
    // Train crossing bells - MUCH LOUDER (every 25-40 seconds)
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
          beatEnvelope = Math.exp(-(beatCycle) * 12) * 0.18; // 3.6x louder (was 0.05)
        } else if (beatCycle >= 0.4 && beatCycle < 0.7) {
          beatEnvelope = Math.exp(-(beatCycle - 0.4) * 12) * 0.18;
        }
        
        const bell = Math.sin(2 * Math.PI * bellFreq * t) +
                     Math.sin(2 * Math.PI * bellFreq * 2.1 * t) * 0.3;
        
        data[bellStart + i] += bell * beatEnvelope;
      }
      
      bellTime += 25 + Math.random() * 15;
    }
    
    // Train brake screech - LOUDER (occasional, every 30-50 seconds)
    let screechTime = 25 + Math.random() * 20;
    while (screechTime < DURATION) {
      const screechStart = Math.floor(screechTime * SAMPLE_RATE);
      const screechDuration = 1.0 + Math.random() * 0.5;
      const screechLength = Math.floor(screechDuration * SAMPLE_RATE);
      
      for (let i = 0; i < screechLength && screechStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        
        const freq = 800 + Math.sin(t * 30) * 200;
        const envelope = Math.exp(-t * 3) * 0.14; // 3.5x louder (was 0.04)
        const screech = Math.sin(2 * Math.PI * freq * t);
        
        data[screechStart + i] += screech * envelope;
      }
      
      screechTime += 30 + Math.random() * 20;
    }
    
    // People chatter - LOUDER
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      const chatter = Math.sin(2 * Math.PI * (800 + Math.random() * 400) * t) * 0.025; // 3x louder (was 0.008)
      data[i] += chatter * (Math.random() * 0.5 + 0.5);
    }
  }

  writeWavFile('cityscape_v5.wav', channels);
}

console.log('Generating cityscape V5 (no rain, much louder)...\n');
generateCityscapeV5();
console.log('\n✓ Cityscape V5 generated!');
console.log('Changes from V4:');
console.log('- ✗ REMOVED all continuous rumble/noise (was causing rain-like sound)');
console.log('- ✓ Cars: 0.40 (was 0.12) - 3.3x louder');
console.log('- ✓ Trucks: 0.45 (was 0.15) - 3x louder');
console.log('- ✓ Train rumble: 0.12 (was 0.035) - 3.4x louder');
console.log('- ✓ Train horns: 0.25 (was 0.08) - 3x louder');
console.log('- ✓ Crossing bells: 0.18 (was 0.05) - 3.6x louder');
console.log('- ✓ Brake screeches: 0.14 (was 0.04) - 3.5x louder');
console.log('- ✓ People chatter: 0.025 (was 0.008) - 3x louder');
console.log('\nNo continuous noise = no rain sound!');
console.log('Overall volume increased ~3-3.5x');
console.log(`\nOutput directory: ${outputDir}`);

























