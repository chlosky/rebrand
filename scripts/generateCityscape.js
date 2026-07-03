// Generate cityscape sound using Mirror Mode methodology
// Based on ocean_v3's unintentional city vibe + intentional city elements
// Run with: node scripts/generateCityscape.js

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

function generateCityscape() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Base ambient city rumble (2-second looping buffer)
  const bufferLength = SAMPLE_RATE * 2;
  const cityRumble = new Float32Array(bufferLength);
  
  // Use pink noise for city rumble
  let lastOut = 0;
  for (let i = 0; i < bufferLength; i++) {
    const white = Math.random() * 2 - 1;
    cityRumble[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = cityRumble[i];
  }
  
  // Apply lowpass at 600 Hz for distant city rumble
  const rumbleFiltered = applyLowpassFilter(cityRumble, SAMPLE_RATE, 600, 0.8);

  // Build the cityscape
  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base city rumble (loop the 2-second buffer with 0.12 gain)
    for (let i = 0; i < length; i++) {
      const bufferIndex = i % bufferLength;
      data[i] = rumbleFiltered[bufferIndex] * 0.12;
    }
    
    // Add occasional car passes (every 3-7 seconds)
    let carTime = 2 + Math.random() * 3;
    while (carTime < DURATION) {
      const carStart = Math.floor(carTime * SAMPLE_RATE);
      const carDuration = 2.0 + Math.random() * 1.5; // 2-3.5 seconds
      const carLength = Math.floor(carDuration * SAMPLE_RATE);
      
      for (let i = 0; i < carLength && carStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / carDuration;
        
        // Doppler effect simulation: frequency starts high, ends low
        const baseFreq = 120;
        const freq = baseFreq * (1.3 - progress * 0.6); // 156 Hz → 84 Hz
        
        // Volume envelope: fade in, peak, fade out
        let envelope;
        if (progress < 0.3) {
          envelope = progress / 0.3 * 0.08; // Fade in
        } else if (progress > 0.7) {
          envelope = (1 - progress) / 0.3 * 0.08; // Fade out
        } else {
          envelope = 0.08; // Peak
        }
        
        // Low rumble + some engine texture
        const rumble = Math.sin(2 * Math.PI * freq * t);
        const texture = (Math.random() * 2 - 1) * 0.3;
        
        data[carStart + i] += (rumble * 0.7 + texture * 0.3) * envelope;
      }
      
      carTime += 3 + Math.random() * 4;
    }
    
    // Add extremely faint distant sirens (every 15-25 seconds)
    let sirenTime = 15 + Math.random() * 10;
    while (sirenTime < DURATION) {
      const sirenStart = Math.floor(sirenTime * SAMPLE_RATE);
      const sirenDuration = 3.0 + Math.random() * 2.0; // 3-5 seconds
      const sirenLength = Math.floor(sirenDuration * SAMPLE_RATE);
      
      for (let i = 0; i < sirenLength && sirenStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const cycleSpeed = 0.5; // Wail speed
        
        // Oscillating siren frequency (600-900 Hz)
        const sirenFreq = 750 + Math.sin(2 * Math.PI * cycleSpeed * t) * 150;
        
        // Very faint envelope (0.02-0.04 max)
        const progress = (i / sirenLength);
        const envelope = 0.02 + Math.sin(Math.PI * progress) * 0.02;
        
        data[sirenStart + i] += Math.sin(2 * Math.PI * sirenFreq * t) * envelope;
      }
      
      sirenTime += 15 + Math.random() * 10;
    }
    
    // Add occasional train horn (every 20-35 seconds)
    let trainTime = 20 + Math.random() * 15;
    while (trainTime < DURATION) {
      const trainStart = Math.floor(trainTime * SAMPLE_RATE);
      const trainDuration = 1.5; // 1.5 second horn
      const trainLength = Math.floor(trainDuration * SAMPLE_RATE);
      
      for (let i = 0; i < trainLength && trainStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        
        // Train horn is typically two tones
        const freq1 = 220; // Low tone
        const freq2 = 329.63; // High tone (E4)
        
        // Envelope
        let envelope;
        if (t < 0.1) {
          envelope = t / 0.1 * 0.06; // Quick attack
        } else if (t > 1.2) {
          envelope = (1.5 - t) / 0.3 * 0.06; // Decay
        } else {
          envelope = 0.06; // Sustain
        }
        
        const horn = Math.sin(2 * Math.PI * freq1 * t) * 0.5 + 
                     Math.sin(2 * Math.PI * freq2 * t) * 0.5;
        
        data[trainStart + i] += horn * envelope;
      }
      
      trainTime += 20 + Math.random() * 15;
    }
    
    // Add distant train rumble/clatter (continuous but very quiet)
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      // Low frequency rumble with rhythm
      const clatterFreq = 2.0 + Math.sin(t * 0.3) * 0.5; // 1.5-2.5 Hz rhythm
      const clatter = Math.sin(2 * Math.PI * clatterFreq * t) * 0.015;
      data[i] += clatter;
    }
    
    // Add occasional horn honks (every 8-15 seconds)
    let honkTime = 5 + Math.random() * 8;
    while (honkTime < DURATION) {
      const honkStart = Math.floor(honkTime * SAMPLE_RATE);
      const honkDuration = 0.3 + Math.random() * 0.4; // 0.3-0.7 seconds
      const honkLength = Math.floor(honkDuration * SAMPLE_RATE);
      const honkFreq = 300 + Math.random() * 200; // Variable horn pitch
      
      for (let i = 0; i < honkLength && honkStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / honkDuration) * 0.05; // Bell curve
        data[honkStart + i] += Math.sin(2 * Math.PI * honkFreq * t) * envelope;
      }
      
      honkTime += 8 + Math.random() * 7;
    }
  }

  writeWavFile('cityscape.wav', channels);
}

console.log('Generating cityscape sound (Mirror Mode methodology)...\n');
generateCityscape();
console.log('\n✓ Cityscape generated!');
console.log('- Base city rumble: Pink noise → 600Hz lowpass, 0.12 gain');
console.log('- Car passes: Every 3-7s with doppler effect');
console.log('- Distant sirens: Every 15-25s (very faint, 0.02-0.04 volume)');
console.log('- Train horns: Every 20-35s (two-tone, 0.06 volume)');
console.log('- Train rumble: Continuous low clatter (0.015 volume)');
console.log('- Horn honks: Every 8-15s (0.05 volume)');
console.log(`\nOutput directory: ${outputDir}`);

























