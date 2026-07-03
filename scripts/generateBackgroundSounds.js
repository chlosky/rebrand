// Node.js script to generate 1-minute background sound files
// Run with: node scripts/generateBackgroundSounds.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const SAMPLE_RATE = 22050; // 22.05 kHz (same as in audioProcessor.ts)
const DURATION = 60; // 60 seconds
const NUM_CHANNELS = 2; // Stereo
const BYTES_PER_SAMPLE = 2; // 16-bit

// Helper to write WAV file
function writeWavFile(filename, audioData) {
  const numSamples = audioData[0].length;
  const dataSize = numSamples * NUM_CHANNELS * BYTES_PER_SAMPLE;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // WAV Header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // PCM format size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, offset); offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 4;
  buffer.writeUInt16LE(NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2; // 16 bits per sample
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write interleaved audio data
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

// Generate Rain
function generateRain() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Generate white noise
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Apply low-pass filter for rain sound
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.7 + data[i - 1] * 0.3;
    }
  }

  writeWavFile('Rain.wav', channels);
}

// Generate Ocean
function generateOcean() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      // Multiple sine waves at different frequencies to simulate waves
      data[i] = 
        Math.sin(2 * Math.PI * 0.5 * t) * 0.3 +
        Math.sin(2 * Math.PI * 0.7 * t) * 0.2 +
        Math.sin(2 * Math.PI * 1.2 * t) * 0.15 +
        (Math.random() * 2 - 1) * 0.1; // Add noise
    }

    // Smooth the wave
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.8 + data[i - 1] * 0.2;
    }
  }

  writeWavFile('Ocean.wav', channels);
}

// Generate Nature Park (forest-style)
function generateNaturePark() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Wind sound (filtered noise)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    // Low-pass filter for wind
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.5 + data[i - 1] * 0.5;
    }

    // Add occasional bird chirps (random high frequency bursts)
    for (let i = 0; i < length; i += Math.floor(Math.random() * SAMPLE_RATE * 2) + SAMPLE_RATE) {
      const chirpLength = Math.floor(SAMPLE_RATE * 0.2);
      for (let j = 0; j < chirpLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        data[i + j] += Math.sin(2 * Math.PI * (2000 + Math.random() * 1000) * t) * 0.2 * Math.exp(-t * 10);
      }
    }
  }

  writeWavFile('Nature Park.wav', channels);
}

// Generate Gold Coins (metallic shimmer)
function generateGoldCoins() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      // High-frequency metallic tones with random timing
      data[i] = (Math.random() * 2 - 1) * 0.15 +
        Math.sin(2 * Math.PI * 2000 * t) * 0.08 +
        Math.sin(2 * Math.PI * 3200 * t) * 0.05;
    }
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.7 + data[i - 1] * 0.3;
    }
  }

  writeWavFile('Gold Coins.wav', channels);
}

// Generate City Corner (urban ambience)
function generateCityCorner() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.85 + data[i - 1] * 0.15;
    }
  }

  writeWavFile('City Corner.wav', channels);
}

// Generate Fireplace
function generateFireplace() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Base crackle (filtered noise)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    // Apply filter for base fire sound
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.6 + data[i - 1] * 0.4;
    }

    // Add random pops and crackles
    for (let i = 0; i < length; i += Math.floor(Math.random() * SAMPLE_RATE * 0.5) + SAMPLE_RATE * 0.1) {
      const popLength = Math.floor(SAMPLE_RATE * 0.05); // 50ms pops
      const popIntensity = 0.3 + Math.random() * 0.4;
      
      for (let j = 0; j < popLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.exp(-t * 30); // Sharp decay
        data[i + j] += (Math.random() * 2 - 1) * popIntensity * envelope;
      }
    }
  }

  writeWavFile('Fireplace.wav', channels);
}

// Generate all sounds (must match dropdown in Subliminal Maker: City Corner, Fireplace, Gold Coins, Nature Park, Ocean, Rain)
console.log('Generating background sounds...\n');
generateCityCorner();
generateFireplace();
generateGoldCoins();
generateNaturePark();
generateOcean();
generateRain();
console.log('\n✓ All background sounds generated successfully!');
console.log(`Output directory: ${outputDir}`);

