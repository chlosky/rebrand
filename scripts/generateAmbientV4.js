// Generate Ambient V4 - Better treble balance to prevent distortion
// Run with: node scripts/generateAmbientV4.js

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

function generateAmbientV4() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  // Same good chord progression as V3
  const chords = [
    [130.81, 164.81, 196.00], // C major
    [146.83, 174.61, 220.00], // D minor
    [164.81, 196.00, 246.94], // E minor
    [174.61, 220.00, 261.63], // F major
  ];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    let chordIndex = 0;
    const chordDuration = SAMPLE_RATE * 6; // 6 seconds per chord

    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      if (i % chordDuration === 0 && i > 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }

      const chord = chords[chordIndex];
      
      // Smoother envelope
      const localTime = (i % chordDuration) / SAMPLE_RATE;
      const envelope = 0.26 * (1 - Math.cos(2 * Math.PI * localTime / 6)); // Reduced from 0.28
      
      // Better balanced note volumes - reduced overall to prevent clipping
      data[i] = chord.reduce((sum, freq, idx) => {
        const noteVolume = idx === 0 ? 0.32 : (idx === 1 ? 0.23 : 0.18); // Reduced from 0.35, 0.25, 0.20
        return sum + Math.sin(2 * Math.PI * freq * t) * envelope * noteVolume;
      }, 0);
      
      // Reduced harmonic overtones to prevent harsh treble
      data[i] += Math.sin(2 * Math.PI * chord[0] * 2 * t) * envelope * 0.04; // Reduced from 0.06
      data[i] += Math.sin(2 * Math.PI * chord[1] * 2 * t) * envelope * 0.02; // Reduced from 0.04
    }

    // Apply lowpass filter to soften high frequencies and prevent distortion
    const filtered = applyLowpassFilter(data, SAMPLE_RATE, 3000, 0.7);
    
    // Copy filtered data back
    for (let i = 0; i < length; i++) {
      data[i] = filtered[i];
    }
    
    // Gentler smoothing for warmth
    for (let i = 1; i < length; i++) {
      data[i] = data[i] * 0.88 + data[i - 1] * 0.12; // Slightly less smoothing than before
    }
  }

  writeWavFile('ambient_v4.wav', channels);
}

console.log('Generating Ambient V4 (better treble balance)...\n');
generateAmbientV4();
console.log('\n✓ Ambient V4 generated!');
console.log('Changes from V3:');
console.log('- ✓ Reduced overall volume to prevent clipping');
console.log('- ✓ Lower note volumes: root 0.32 (was 0.35), third 0.23 (was 0.25), fifth 0.18 (was 0.20)');
console.log('- ✓ Reduced harmonic overtones: 0.04/0.02 (was 0.06/0.04)');
console.log('- ✓ Added 3000Hz lowpass filter to soften high frequencies');
console.log('- ✓ Reduced envelope: 0.26 (was 0.28)');
console.log('- ✓ Adjusted smoothing for balanced warmth');
console.log('\nKeeping: Same chord progression, 6-second timing, smooth transitions');
console.log(`\nOutput directory: ${outputDir}`);

























