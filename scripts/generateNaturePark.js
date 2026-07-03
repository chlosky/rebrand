// Generate Nature Park audio based on Mirror Mode's gold-sparks-overlay sound
// Run with: node scripts/generateNaturePark.js

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

// Generate bird chirp using exponential frequency sweep (like Mirror Mode)
function generateBirdChirp(startSample, data, baseFreq, sampleRate) {
  const chirpDuration = 0.5; // 0.5 seconds
  const chirpLength = Math.floor(sampleRate * chirpDuration);
  
  for (let i = 0; i < chirpLength && startSample + i < data.length; i++) {
    const t = i / sampleRate;
    
    // Exponential frequency ramp: baseFreq -> baseFreq * 1.8 over 0.25s
    const freqRampProgress = Math.min(t / 0.25, 1);
    const currentFreq = baseFreq * Math.pow(1.8, freqRampProgress);
    
    // Envelope: quick attack, slow decay
    let envelope;
    if (t < 0.05) {
      // Attack phase: 0.0001 -> 0.08 in 0.05s
      envelope = 0.0001 + (0.08 - 0.0001) * (t / 0.05);
    } else {
      // Decay phase: 0.08 -> 0.0001 over remaining time
      const decayProgress = (t - 0.05) / (chirpDuration - 0.05);
      envelope = 0.08 * Math.pow(0.0001 / 0.08, decayProgress);
    }
    
    // Generate sine wave
    const phase = 2 * Math.PI * currentFreq * t;
    data[startSample + i] += Math.sin(phase) * envelope;
  }
}

// Generate Nature Park (based on Mirror Mode gold-sparks-overlay audio)
function generateNaturePark() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // 1. Generate gentle wind (filtered white noise at 0.18 volume)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }

    // Apply low-pass filter for wind (softer than original forest)
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.4 + data[i - 1] * 0.6; // Heavier filtering
    }

    // 2. Add realistic bird chirps (every 3.2-5.6 seconds like Mirror Mode)
    let currentTime = 0;
    while (currentTime < DURATION) {
      // Random interval between 3.2 and 5.6 seconds
      const interval = 3.2 + Math.random() * 2.4;
      currentTime += interval;
      
      if (currentTime >= DURATION) break;
      
      const chirpStartSample = Math.floor(currentTime * SAMPLE_RATE);
      
      // Random base frequency between 1200-2000 Hz (like Mirror Mode)
      const baseFreq = 1200 + Math.random() * 800;
      
      generateBirdChirp(chirpStartSample, data, baseFreq, SAMPLE_RATE);
    }

    // 3. Add occasional rustling sounds (leaves/branches)
    for (let i = 0; i < length; i += Math.floor(SAMPLE_RATE * 7) + Math.floor(Math.random() * SAMPLE_RATE * 6)) {
      const rustleLength = Math.floor(SAMPLE_RATE * 0.4); // 400ms rustles
      for (let j = 0; j < rustleLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / 0.4) * 0.04; // Gentle envelope
        const rustleNoise = (Math.random() * 2 - 1) * envelope;
        // Add some filtered high-frequency for leaf texture
        data[i + j] += rustleNoise;
      }
    }

    // 4. Add very occasional distant bird calls (lower frequency, background)
    for (let i = 0; i < length; i += Math.floor(SAMPLE_RATE * 15) + Math.floor(Math.random() * SAMPLE_RATE * 10)) {
      const callLength = Math.floor(SAMPLE_RATE * 0.8);
      for (let j = 0; j < callLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.exp(-t * 3) * 0.03; // Very quiet, distant
        const freq = 600 + Math.random() * 400; // Lower frequency
        data[i + j] += Math.sin(2 * Math.PI * freq * t) * envelope;
      }
    }
  }

  writeWavFile('nature_park.wav', channels);
}

console.log('Generating Nature Park sound (based on Mirror Mode)...\n');
generateNaturePark();
console.log('\n✓ Nature Park sound generated successfully!');
console.log(`Output directory: ${outputDir}`);

























