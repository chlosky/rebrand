// Generate 4 different money-evoking sounds
// 1. Money counter machine
// 2. Slot machine jackpot
// 3. Digital payment success
// 4. Stock market bell
// Run with: node scripts/generateMoneySounds.js

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

// 1. Money Counter Machine
function generateMoneyCounter() {
  const duration = 60;
  const length = SAMPLE_RATE * duration;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Background motor hum
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      const motorHum = Math.sin(2 * Math.PI * 60 * t) * 0.08; // 60 Hz motor
      data[i] = motorHum;
    }
    
    // Multiple counting sessions throughout the track
    let sessionTime = 2;
    while (sessionTime < duration - 8) {
      const sessionStart = Math.floor(sessionTime * SAMPLE_RATE);
      const sessionDuration = 4 + Math.random() * 3; // 4-7 seconds of counting
      const clickRate = 18 + Math.random() * 4; // 18-22 bills per second
      const numClicks = Math.floor(sessionDuration * clickRate);
      
      for (let c = 0; c < numClicks; c++) {
        const clickTime = sessionTime + (c / clickRate);
        const clickStart = Math.floor(clickTime * SAMPLE_RATE);
        const clickLength = Math.floor(SAMPLE_RATE * 0.008); // 8ms click
        
        for (let i = 0; i < clickLength && clickStart + i < length; i++) {
          const t = i / SAMPLE_RATE;
          // Sharp mechanical click
          const envelope = Math.exp(-t * 400) * 0.20;
          const click = Math.sin(2 * Math.PI * 2200 * t) * 0.6 + 
                       (Math.random() * 2 - 1) * 0.4;
          data[clickStart + i] += click * envelope;
        }
      }
      
      // End-of-count beep
      const beepStart = Math.floor((sessionTime + sessionDuration) * SAMPLE_RATE);
      const beepLength = Math.floor(SAMPLE_RATE * 0.15);
      for (let i = 0; i < beepLength && beepStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / 0.15) * 0.15;
        const beep = Math.sin(2 * Math.PI * 800 * t);
        data[beepStart + i] += beep * envelope;
      }
      
      sessionTime += sessionDuration + 2 + Math.random() * 4; // Pause between sessions
    }
  }

  writeWavFile('money_counter.wav', channels);
}

// 2. Slot Machine Jackpot
function generateSlotMachine() {
  const duration = 8; // Shorter, single jackpot event
  const length = SAMPLE_RATE * duration;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Spinning reels (0-2 seconds)
    for (let i = 0; i < SAMPLE_RATE * 2; i++) {
      const t = i / SAMPLE_RATE;
      // Mechanical spinning sound
      const spinFreq = 8 + t * 3; // Slowing down
      const spin = Math.sin(2 * Math.PI * spinFreq * t) * 0.12;
      const rattle = (Math.random() * 2 - 1) * 0.05;
      data[i] = spin + rattle;
    }
    
    // Reel stops (2, 2.3, 2.7 seconds)
    const stopTimes = [2.0, 2.3, 2.7];
    for (const stopTime of stopTimes) {
      const stopStart = Math.floor(stopTime * SAMPLE_RATE);
      const stopLength = Math.floor(SAMPLE_RATE * 0.05);
      for (let i = 0; i < stopLength && stopStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.exp(-t * 50) * 0.25;
        const clunk = Math.sin(2 * Math.PI * 150 * t) * 0.6 +
                     (Math.random() * 2 - 1) * 0.4;
        data[stopStart + i] += clunk * envelope;
      }
    }
    
    // JACKPOT bell/siren (3-4.5 seconds)
    const sirenStart = Math.floor(3 * SAMPLE_RATE);
    const sirenLength = Math.floor(SAMPLE_RATE * 1.5);
    for (let i = 0; i < sirenLength && sirenStart + i < length; i++) {
      const t = i / SAMPLE_RATE;
      // Alternating tones
      const freq = t % 0.25 < 0.125 ? 800 : 1000;
      const envelope = 0.30;
      const siren = Math.sin(2 * Math.PI * freq * t);
      data[sirenStart + i] += siren * envelope;
    }
    
    // Cascade of metallic pings (3.5-8 seconds)
    let pingTime = 3.5;
    let pingRate = 5; // Pings per second (starts fast)
    while (pingTime < 7.5) {
      const pingStart = Math.floor(pingTime * SAMPLE_RATE);
      const pingFreq = 1800 + Math.random() * 1200; // 1800-3000 Hz
      const pingLength = Math.floor(SAMPLE_RATE * 0.3);
      
      for (let i = 0; i < pingLength && pingStart + i < length; i++) {
        const t = i / SAMPLE_RATE;
        const envelope = Math.exp(-t * 8) * 0.18;
        const ping = Math.sin(2 * Math.PI * pingFreq * t);
        data[pingStart + i] += ping * envelope;
      }
      
      pingTime += 1 / pingRate;
      pingRate = Math.max(1, pingRate - 0.3); // Slow down
    }
  }

  writeWavFile('slot_machine.wav', channels);
}

// 3. Digital Payment Success
function generateDigitalPayment() {
  const duration = 2; // Short, clean success sound
  const length = SAMPLE_RATE * duration;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Ascending beep tones (like Apple Pay)
    const tones = [800, 1000, 1200]; // Rising tones
    const toneStarts = [0.0, 0.08, 0.16]; // Quick succession
    
    for (let i = 0; i < tones.length; i++) {
      const toneStart = Math.floor(toneStarts[i] * SAMPLE_RATE);
      const toneDuration = 0.12;
      const toneLength = Math.floor(SAMPLE_RATE * toneDuration);
      
      for (let j = 0; j < toneLength && toneStart + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const envelope = Math.sin(Math.PI * t / toneDuration) * 0.25;
        const tone = Math.sin(2 * Math.PI * tones[i] * t);
        data[toneStart + j] += tone * envelope;
      }
    }
    
    // Final "cha-ching" confirmation tone (0.5-1.5 seconds)
    const chingStart = Math.floor(0.5 * SAMPLE_RATE);
    const chingLength = Math.floor(SAMPLE_RATE * 1.0);
    const chingFreq = 2500;
    
    for (let i = 0; i < chingLength && chingStart + i < length; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.exp(-t * 5) * 0.30;
      const ching = 
        Math.sin(2 * Math.PI * chingFreq * t) * 0.5 +
        Math.sin(2 * Math.PI * chingFreq * 2 * t) * 0.3 +
        Math.sin(2 * Math.PI * chingFreq * 3 * t) * 0.2;
      data[chingStart + i] += ching * envelope;
    }
  }

  writeWavFile('digital_payment.wav', channels);
}

// 4. Stock Market Bell
function generateStockBell() {
  const duration = 5; // Single powerful bell ring
  const length = SAMPLE_RATE * duration;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Powerful bell strike
    const bellFreq = 800; // Fundamental
    
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE;
      
      // Multiple inharmonic overtones for realistic bell
      const envelope = Math.exp(-t * 1.2);
      
      const bell = 
        Math.sin(2 * Math.PI * bellFreq * t) * 0.40 +           // Fundamental
        Math.sin(2 * Math.PI * bellFreq * 2.1 * t) * 0.25 +      // 1st overtone
        Math.sin(2 * Math.PI * bellFreq * 3.2 * t) * 0.15 +      // 2nd overtone
        Math.sin(2 * Math.PI * bellFreq * 4.5 * t) * 0.10 +      // 3rd overtone
        Math.sin(2 * Math.PI * bellFreq * 5.9 * t) * 0.06 +      // 4th overtone
        Math.sin(2 * Math.PI * bellFreq * 7.3 * t) * 0.04;       // 5th overtone
      
      // Impact noise at the very beginning
      let impact = 0;
      if (t < 0.01) {
        impact = (Math.random() * 2 - 1) * Math.exp(-t * 200) * 0.15;
      }
      
      data[i] = (bell * envelope) + impact;
    }
  }

  writeWavFile('stock_bell.wav', channels);
}

console.log('Generating 4 money-evoking sounds...\n');
console.log('1. Money Counter Machine...');
generateMoneyCounter();
console.log('   - Rapid bill counting clicks (18-22/sec)');
console.log('   - 60Hz motor hum background');
console.log('   - End-of-count beeps');
console.log('   - Multiple counting sessions\n');

console.log('2. Slot Machine Jackpot...');
generateSlotMachine();
console.log('   - Spinning reels (0-2s)');
console.log('   - Three reel stops (clunks)');
console.log('   - Jackpot siren (3-4.5s)');
console.log('   - Cascade of metallic pings\n');

console.log('3. Digital Payment Success...');
generateDigitalPayment();
console.log('   - Ascending beep tones (800→1000→1200 Hz)');
console.log('   - Clean modern sound');
console.log('   - Final "cha-ching" confirmation\n');

console.log('4. Stock Market Bell...');
generateStockBell();
console.log('   - Powerful bell ring (800 Hz fundamental)');
console.log('   - 6 inharmonic overtones');
console.log('   - Impact noise at strike');
console.log('   - Long decay (5 seconds)\n');

console.log('✓ All 4 money sounds generated!');
console.log(`\nOutput directory: ${outputDir}`);

























