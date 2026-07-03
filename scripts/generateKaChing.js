// Generate pure "ka-ching!" sound
// Just the bell/ching, no drawer or coins
// Run with: node scripts/generateKaChing.js

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
const DURATION = 1.5; // Short file, just the sound
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
      const intSample = sample < 0 ? sample * 0.8000 : sample * 0x7FFF;
      buffer.writeInt16LE(Math.round(intSample), offset);
      offset += 2;
    }
  }

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

function generateKaChing() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // "Ka" part - quick metallic hit (like striking the register)
    const kaStart = 0;
    const kaLength = Math.floor(SAMPLE_RATE * 0.08); // 80ms
    const kaFreq = 1800;
    
    for (let i = 0; i < kaLength; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.exp(-t * 30) * 0.25; // Quick decay
      
      // Sharp metallic hit
      const ka = 
        Math.sin(2 * Math.PI * kaFreq * t) * 0.5 +
        Math.sin(2 * Math.PI * kaFreq * 2.3 * t) * 0.3 +
        (Math.random() * 2 - 1) * 0.2; // Noise burst
      
      data[kaStart + i] = ka * envelope;
    }
    
    // "CHING!" part - bright bell ring (the main event)
    const chingStart = Math.floor(SAMPLE_RATE * 0.05); // Slight overlap with ka
    const chingLength = Math.floor(SAMPLE_RATE * 1.2); // 1.2 seconds
    const chingFreq = 4500; // Bright, high bell tone
    
    for (let i = 0; i < chingLength; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.exp(-t * 4); // Slower decay for ringing
      
      // Bright bell with inharmonic overtones
      const ching = 
        Math.sin(2 * Math.PI * chingFreq * t) * 0.45 +
        Math.sin(2 * Math.PI * chingFreq * 2.1 * t) * 0.25 +
        Math.sin(2 * Math.PI * chingFreq * 3.2 * t) * 0.15 +
        Math.sin(2 * Math.PI * chingFreq * 4.5 * t) * 0.10 +
        Math.sin(2 * Math.PI * chingFreq * 5.8 * t) * 0.05;
      
      data[chingStart + i] += ching * envelope * 0.5;
    }
  }

  writeWavFile('ka_ching.wav', channels);
}

console.log('Generating pure "ka-ching!" sound...\n');
generateKaChing();
console.log('\n✓ Ka-ching generated!');
console.log('- "Ka": Quick metallic hit at 1800Hz (80ms)');
console.log('- "CHING!": Bright bell ring at 4500Hz (1.2s decay)');
console.log('- Inharmonic overtones for realistic bell sound');
console.log('- Total duration: 1.5 seconds');
console.log(`\nOutput directory: ${outputDir}`);

























