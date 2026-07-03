// Node.js script to generate improved v2 background sound files
// Run with: node scripts/generateBackgroundSoundsV2.js

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

const SAMPLE_RATE = 22050; // 22.05 kHz
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
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(NUM_CHANNELS, offset); offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 4;
  buffer.writeUInt16LE(NUM_CHANNELS * BYTES_PER_SAMPLE, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
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

// Generate Rain V2 - Soft droplets with occasional faint thunder
function generateRainV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Generate very soft filtered noise for gentle rain
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12; // Much quieter base
    }

    // Heavy low-pass filter for soft droplet sound
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.3 + data[i - 1] * 0.7; // More smoothing
    }

    // Add individual droplet sounds (tiny plops)
    for (let i = 0; i < length; i += Math.floor(Math.random() * 400) + 200) {
      const dropletLength = Math.floor(SAMPLE_RATE * 0.01); // 10ms droplets
      for (let j = 0; j < dropletLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.exp(-t * 200);
        data[i + j] += Math.sin(2 * Math.PI * (800 + Math.random() * 400) * t) * 0.08 * envelope;
      }
    }

    // Add occasional very faint distant thunder (every ~15-20 seconds)
    const thunderTimes = [15, 35, 52]; // 3 thunder rumbles in 60 seconds
    for (const thunderTime of thunderTimes) {
      const thunderStart = Math.floor(thunderTime * SAMPLE_RATE);
      const thunderLength = Math.floor(SAMPLE_RATE * 2); // 2 second rumble
      
      for (let j = 0; j < thunderLength && thunderStart + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / 2) * 0.06; // Very faint
        // Low frequency rumble
        data[thunderStart + j] += 
          Math.sin(2 * Math.PI * 40 * t) * envelope * 0.5 +
          Math.sin(2 * Math.PI * 60 * t) * envelope * 0.3 +
          (Math.random() * 2 - 1) * envelope * 0.2;
      }
    }
  }

  writeWavFile('rain_v2.wav', channels);
}

// Generate Ocean V2 - Smoother, more realistic wave sounds
function generateOceanV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Create smoother wave pattern with multiple overlapping waves
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Primary wave cycle (slower, deeper)
      const wave1 = Math.sin(2 * Math.PI * 0.15 * t) * 0.25;
      const wave2 = Math.sin(2 * Math.PI * 0.22 * t) * 0.2;
      const wave3 = Math.sin(2 * Math.PI * 0.35 * t) * 0.15;
      
      // Higher frequency for foam/texture
      const foam = Math.sin(2 * Math.PI * 1.5 * t) * 0.08;
      
      // Gentle filtered noise for water texture
      const texture = (Math.random() * 2 - 1) * 0.06;
      
      data[i] = wave1 + wave2 + wave3 + foam + texture;
    }

    // Apply heavy smoothing for natural wave flow
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.6 + data[i - 1] * 0.4;
      }
    }

    // Add occasional wave crash (surf)
    for (let i = 0; i < length; i += Math.floor(SAMPLE_RATE * 8) + Math.floor(Math.random() * SAMPLE_RATE * 4)) {
      const crashLength = Math.floor(SAMPLE_RATE * 1.5); // 1.5 second crash
      for (let j = 0; j < crashLength && i + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10)); // Attack + decay
        const crash = (Math.random() * 2 - 1) * envelope * 0.15;
        data[i + j] += crash;
      }
    }
  }

  writeWavFile('ocean_v2.wav', channels);
}

// Generate Ambient V2 - Lower frequencies, more balanced chords
function generateAmbientV2() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Lower, more balanced chord frequencies
  const chords = [
    [65.41, 82.41, 98.00],   // C major (lower octave)
    [73.42, 87.31, 110.00],  // D minor (lower octave)
    [82.41, 98.00, 123.47],  // E minor (lower octave)
    [87.31, 110.00, 130.81], // F major (lower octave)
  ];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    let chordIndex = 0;
    const chordDuration = SAMPLE_RATE * 8; // 8 seconds per chord (slower changes)

    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Change chord every 8 seconds
      if (i % chordDuration === 0 && i > 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }

      const chord = chords[chordIndex];
      
      // Slower, gentler envelope
      const localTime = (i % chordDuration) / SAMPLE_RATE;
      const envelope = 0.25 * (1 - Math.cos(2 * Math.PI * localTime / 8));
      
      // Sum all notes in chord with more balanced volumes
      data[i] = chord.reduce((sum, freq, idx) => {
        // Root note louder, upper notes quieter
        const noteVolume = idx === 0 ? 0.25 : (idx === 1 ? 0.18 : 0.15);
        return sum + Math.sin(2 * Math.PI * freq * t) * envelope * noteVolume;
      }, 0);
      
      // Add subtle pad effect with harmonics
      data[i] += Math.sin(2 * Math.PI * chord[0] * 2 * t) * envelope * 0.05; // Octave harmonic
    }

    // Smooth it out
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.9 + data[i - 1] * 0.1;
    }
  }

  writeWavFile('ambient_v2.wav', channels);
}

// Generate all improved sounds
console.log('Generating improved background sounds (v2)...\n');
generateRainV2();
generateOceanV2();
generateAmbientV2();
console.log('\n✓ All v2 background sounds generated successfully!');
console.log(`Output directory: ${outputDir}`);

























