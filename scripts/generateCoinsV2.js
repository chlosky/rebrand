// Generate realistic coin clinking + cash register sounds
// Run with: node scripts/generateCoinsV2.js

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

// Realistic coin impact sound
function generateCoinImpact(data, startSample, sampleRate, coinType = 'quarter') {
  // Different coin types have different characteristics
  let fundamental, duration, brightness;
  
  if (coinType === 'quarter') {
    fundamental = 3000 + Math.random() * 500; // 3000-3500 Hz
    duration = 0.8 + Math.random() * 0.3; // 0.8-1.1 seconds
    brightness = 0.25;
  } else if (coinType === 'gold') {
    fundamental = 2400 + Math.random() * 400; // 2400-2800 Hz (lower, richer)
    duration = 1.0 + Math.random() * 0.5; // 1.0-1.5 seconds (longer ring)
    brightness = 0.18;
  } else { // penny/dime
    fundamental = 3500 + Math.random() * 800; // 3500-4300 Hz (higher)
    duration = 0.5 + Math.random() * 0.2; // 0.5-0.7 seconds (shorter)
    brightness = 0.3;
  }
  
  const impactLength = Math.floor(sampleRate * duration);
  
  for (let i = 0; i < impactLength && startSample + i < data.length; i++) {
    const t = i / sampleRate;
    
    // Sharp impact followed by ringing decay
    let envelope;
    if (t < 0.001) {
      // Very sharp impact (1ms)
      envelope = t / 0.001;
    } else if (t < 0.01) {
      // Initial loud ring after impact
      envelope = 1.0 - (t - 0.001) / 0.009 * 0.3; // 1.0 -> 0.7
    } else {
      // Exponential decay with bounces
      const baseDecay = Math.exp(-(t - 0.01) * 5);
      // Add bounces (coin bouncing and settling)
      const bounceFreq = 12 - t * 8; // Bounces slow down
      const bounces = Math.exp(-t * 3) * Math.abs(Math.sin(bounceFreq * t)) * 0.3;
      envelope = (0.7 * baseDecay) + bounces;
    }
    
    // Metallic sound with noise burst on impact
    let sound;
    if (t < 0.002) {
      // Impact noise (very short burst)
      sound = (Math.random() * 2 - 1) * 0.5 +
              Math.sin(2 * Math.PI * fundamental * t) * 0.5;
    } else {
      // Pure metallic ring with harmonics
      sound = 
        Math.sin(2 * Math.PI * fundamental * t) * 0.40 +
        Math.sin(2 * Math.PI * fundamental * 1.89 * t) * 0.25 + // Slightly inharmonic
        Math.sin(2 * Math.PI * fundamental * 2.93 * t) * 0.20 +
        Math.sin(2 * Math.PI * fundamental * 4.12 * t) * 0.15;
    }
    
    data[startSample + i] += sound * envelope * brightness;
  }
}

// Realistic coin clinking (60 seconds)
function generateCoinsClinkingV2() {
  const DURATION = 60;
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Add individual coin drops (every 0.8-2.5 seconds)
    let coinTime = 0.5;
    while (coinTime < DURATION) {
      const coinStart = Math.floor(coinTime * SAMPLE_RATE);
      
      // Random coin type
      const rand = Math.random();
      let coinType;
      if (rand < 0.5) {
        coinType = 'quarter'; // Most common
      } else if (rand < 0.75) {
        coinType = 'gold';
      } else {
        coinType = 'penny';
      }
      
      generateCoinImpact(data, coinStart, SAMPLE_RATE, coinType);
      
      coinTime += 0.8 + Math.random() * 1.7; // 0.8-2.5 seconds
    }
    
    // Add occasional coin pile dumps (every 8-15 seconds)
    let dumpTime = 8 + Math.random() * 7;
    while (dumpTime < DURATION) {
      const dumpStart = Math.floor(dumpTime * SAMPLE_RATE);
      const numCoins = 5 + Math.floor(Math.random() * 10); // 5-15 coins
      
      for (let c = 0; c < numCoins; c++) {
        const coinDelay = c * (0.02 + Math.random() * 0.06); // 20-80ms apart
        const coinStart = dumpStart + Math.floor(coinDelay * SAMPLE_RATE);
        
        const rand = Math.random();
        const coinType = rand < 0.6 ? 'quarter' : (rand < 0.85 ? 'gold' : 'penny');
        
        generateCoinImpact(data, coinStart, SAMPLE_RATE, coinType);
      }
      
      dumpTime += 8 + Math.random() * 7;
    }
    
    // Add very subtle room ambience (filtered noise)
    const bufferLength = SAMPLE_RATE * 2;
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      const brown = (lastOut + 0.02 * white) / 1.02;
      lastOut = brown;
      data[i] += brown * 0.03; // Very quiet
    }
  }

  writeWavFile('coins_clinking_v2.wav', channels);
}

// Cash register "cha-ching" sound
function generateCashRegister() {
  const DURATION = 2.5; // Short file, just the sound
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // 1. Drawer opening mechanism (mechanical slide)
    const drawerStart = 0;
    const drawerLength = Math.floor(SAMPLE_RATE * 0.15); // 150ms
    for (let i = 0; i < drawerLength; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = 0.3 * (1 - t / 0.15);
      // Mechanical scraping/sliding sound
      const scrape = (Math.random() * 2 - 1) * envelope * 0.15;
      const lowRumble = Math.sin(2 * Math.PI * 80 * t) * envelope * 0.1;
      data[drawerStart + i] = scrape + lowRumble;
    }
    
    // 2. Bell "ching" (pitched down from ~4000Hz)
    const chingStart = Math.floor(SAMPLE_RATE * 0.1);
    const chingLength = Math.floor(SAMPLE_RATE * 0.4); // 400ms
    const chingFreq = 4200;
    
    for (let i = 0; i < chingLength; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.exp(-t * 12); // Fast decay
      
      // Bell sound with inharmonic overtones
      const bell = 
        Math.sin(2 * Math.PI * chingFreq * t) * 0.4 +
        Math.sin(2 * Math.PI * chingFreq * 2.1 * t) * 0.25 +
        Math.sin(2 * Math.PI * chingFreq * 3.2 * t) * 0.15 +
        Math.sin(2 * Math.PI * chingFreq * 4.5 * t) * 0.1;
      
      data[chingStart + i] += bell * envelope * 0.35;
    }
    
    // 3. Coins jingling in drawer
    const jingleStart = Math.floor(SAMPLE_RATE * 0.2);
    const numJingles = 8;
    for (let j = 0; j < numJingles; j++) {
      const coinStart = jingleStart + Math.floor((j * 0.08 + Math.random() * 0.05) * SAMPLE_RATE);
      generateCoinImpact(data, coinStart, SAMPLE_RATE, 'quarter');
    }
    
    // 4. Drawer settling/closing (soft thud)
    const thudStart = Math.floor(SAMPLE_RATE * 0.8);
    const thudLength = Math.floor(SAMPLE_RATE * 0.3);
    for (let i = 0; i < thudLength; i++) {
      const t = i / SAMPLE_RATE;
      const envelope = Math.exp(-t * 15);
      const thud = Math.sin(2 * Math.PI * 150 * t) * envelope * 0.12;
      data[thudStart + i] += thud;
    }
  }

  writeWavFile('cash_register.wav', channels);
}

console.log('Generating realistic coin sounds...\n');
generateCoinsClinkingV2();
generateCashRegister();
console.log('\n✓ All coin sounds generated!');
console.log('\nCoins Clinking V2:');
console.log('- Realistic coin impacts with sharp attack + bouncing decay');
console.log('- Quarter: 3000-3500Hz, 0.8-1.1s ring');
console.log('- Gold coins: 2400-2800Hz, 1.0-1.5s ring (richer, longer)');
console.log('- Penny/dime: 3500-4300Hz, 0.5-0.7s ring (brighter, shorter)');
console.log('- Individual drops every 0.8-2.5s');
console.log('- Coin pile dumps every 8-15s (5-15 coins)');
console.log('\nCash Register:');
console.log('- Drawer slide mechanism (150ms)');
console.log('- Bell "ching" at 4200Hz (400ms decay)');
console.log('- Coins jingling (8 coins)');
console.log('- Drawer settling thud');
console.log(`\nOutput directory: ${outputDir}`);

























