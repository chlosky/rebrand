// Generate 60-second coins based on cash register sound
// Uses the coin physics from cash register that user liked
// Run with: node scripts/generateCoinsV3.js

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

// Cash register style coin impact (what user liked)
function generateCoinImpact(data, startSample, sampleRate, variation = 1.0) {
  // Base frequency with variation
  const baseFreq = (3000 + Math.random() * 1000) * variation; // 3000-4000 Hz with variation
  const duration = 0.8 + Math.random() * 0.4; // 0.8-1.2 seconds
  const impactLength = Math.floor(sampleRate * duration);
  const intensity = 0.15 + Math.random() * 0.10; // 0.15-0.25
  
  for (let i = 0; i < impactLength && startSample + i < data.length; i++) {
    const t = i / SAMPLE_RATE;
    
    // Sharp impact followed by ringing decay (like cash register)
    let envelope;
    if (t < 0.001) {
      // Very sharp impact (1ms)
      envelope = t / 0.001;
    } else if (t < 0.01) {
      // Initial loud ring after impact
      envelope = 1.0 - (t - 0.001) / 0.009 * 0.3;
    } else {
      // Exponential decay with slight bounces
      const baseDecay = Math.exp(-(t - 0.01) * 5);
      const bounces = Math.exp(-t * 3) * Math.abs(Math.sin(12 * t)) * 0.2;
      envelope = (0.7 * baseDecay) + bounces;
    }
    
    // Metallic sound (like cash register coins)
    let sound;
    if (t < 0.002) {
      // Impact noise
      sound = (Math.random() * 2 - 1) * 0.5 +
              Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
    } else {
      // Pure metallic ring with inharmonic overtones
      sound = 
        Math.sin(2 * Math.PI * baseFreq * t) * 0.40 +
        Math.sin(2 * Math.PI * baseFreq * 1.89 * t) * 0.25 +
        Math.sin(2 * Math.PI * baseFreq * 2.93 * t) * 0.20 +
        Math.sin(2 * Math.PI * baseFreq * 4.12 * t) * 0.15;
    }
    
    data[startSample + i] += sound * envelope * intensity;
  }
}

function generateCoinsV3() {
  const length = SAMPLE_RATE * DURATION;
  const channels = [new Float32Array(length), new Float32Array(length)];

  for (let ch = 0; ch < 2; ch++) {
    const data = channels[ch];
    
    // Pattern 1: Single coin drops (every 1.2-3.5 seconds)
    let singleTime = 0.5;
    while (singleTime < DURATION) {
      const coinStart = Math.floor(singleTime * SAMPLE_RATE);
      const variation = 0.8 + Math.random() * 0.4; // 0.8-1.2x frequency variation
      generateCoinImpact(data, coinStart, SAMPLE_RATE, variation);
      singleTime += 1.2 + Math.random() * 2.3;
    }
    
    // Pattern 2: Double coins (quick succession) - every 6-12 seconds
    let doubleTime = 5 + Math.random() * 5;
    while (doubleTime < DURATION) {
      const firstCoin = Math.floor(doubleTime * SAMPLE_RATE);
      const secondCoin = firstCoin + Math.floor((0.08 + Math.random() * 0.12) * SAMPLE_RATE); // 80-200ms apart
      
      generateCoinImpact(data, firstCoin, SAMPLE_RATE, 0.9 + Math.random() * 0.3);
      generateCoinImpact(data, secondCoin, SAMPLE_RATE, 0.9 + Math.random() * 0.3);
      
      doubleTime += 6 + Math.random() * 6;
    }
    
    // Pattern 3: Coin cascades (handful dropped) - every 10-18 seconds
    let cascadeTime = 8 + Math.random() * 8;
    while (cascadeTime < DURATION) {
      const cascadeStart = Math.floor(cascadeTime * SAMPLE_RATE);
      const numCoins = 4 + Math.floor(Math.random() * 5); // 4-8 coins
      
      for (let c = 0; c < numCoins; c++) {
        // Staggered timing (coins don't all hit at once)
        const delay = c * (0.04 + Math.random() * 0.08); // 40-120ms between coins
        const coinStart = cascadeStart + Math.floor(delay * SAMPLE_RATE);
        
        // More variation in cascade
        const variation = 0.7 + Math.random() * 0.6; // 0.7-1.3x
        generateCoinImpact(data, coinStart, SAMPLE_RATE, variation);
      }
      
      cascadeTime += 10 + Math.random() * 8;
    }
    
    // Pattern 4: Coin rolls (rolling across surface) - every 15-25 seconds
    let rollTime = 12 + Math.random() * 10;
    while (rollTime < DURATION) {
      const rollStart = Math.floor(rollTime * SAMPLE_RATE);
      const rollDuration = 0.8 + Math.random() * 0.6; // 0.8-1.4 seconds
      const numBounces = 8 + Math.floor(Math.random() * 6); // 8-13 small bounces
      
      for (let b = 0; b < numBounces; b++) {
        const bounceTime = (b / numBounces) * rollDuration;
        const bounceStart = rollStart + Math.floor(bounceTime * SAMPLE_RATE);
        
        // Bounces get smaller and closer together as coin settles
        const bounceSize = (1 - b / numBounces) * 0.15; // Decreasing intensity
        const bounceFreq = 3200 + Math.random() * 800;
        const bounceDur = 0.1 / (1 + b * 0.3); // Shorter as it rolls
        const bounceLength = Math.floor(SAMPLE_RATE * bounceDur);
        
        for (let i = 0; i < bounceLength && bounceStart + i < data.length; i++) {
          const t = i / SAMPLE_RATE;
          const envelope = Math.exp(-t * 15) * bounceSize;
          const sound = Math.sin(2 * Math.PI * bounceFreq * t);
          data[bounceStart + i] += sound * envelope;
        }
      }
      
      rollTime += 15 + Math.random() * 10;
    }
    
    // Pattern 5: Coin spins (spinning coin wobbling down) - every 20-35 seconds
    let spinTime = 18 + Math.random() * 15;
    while (spinTime < DURATION) {
      const spinStart = Math.floor(spinTime * SAMPLE_RATE);
      const spinDuration = 1.5 + Math.random() * 1.0; // 1.5-2.5 seconds
      const spinLength = Math.floor(SAMPLE_RATE * spinDuration);
      const spinFreq = 3500 + Math.random() * 500;
      
      for (let i = 0; i < spinLength; i++) {
        const t = i / SAMPLE_RATE;
        const progress = t / spinDuration;
        
        // Wobble frequency increases as coin slows (faster wobble)
        const wobbleFreq = 5 + progress * 25; // 5Hz -> 30Hz
        const wobbleAmp = 0.5 * (1 - progress); // Decreases as it settles
        
        // Amplitude modulation (wobbling coin)
        const wobble = 1 + Math.sin(2 * Math.PI * wobbleFreq * t) * wobbleAmp;
        const envelope = Math.exp(-t * 2) * 0.12;
        
        const sound = Math.sin(2 * Math.PI * spinFreq * t) * wobble;
        data[spinStart + i] += sound * envelope;
      }
      
      spinTime += 20 + Math.random() * 15;
    }
    
    // Very subtle room ambience
    const bufferLength = SAMPLE_RATE * 2;
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      const brown = (lastOut + 0.02 * white) / 1.02;
      lastOut = brown;
      data[i] += brown * 0.04;
    }
  }

  writeWavFile('coins_v3.wav', channels);
}

console.log('Generating coins V3 (based on cash register sound)...\n');
generateCoinsV3();
console.log('\n✓ Coins V3 generated!');
console.log('Based on cash register coin physics that user liked');
console.log('\nVariation patterns:');
console.log('1. Single drops: Every 1.2-3.5s, varied pitch (0.8-1.2x)');
console.log('2. Double coins: Every 6-12s, 80-200ms apart');
console.log('3. Cascades: Every 10-18s, 4-8 coins rapid succession');
console.log('4. Coin rolls: Every 15-25s, bouncing/rolling across surface');
console.log('5. Coin spins: Every 20-35s, wobbling spin settling down');
console.log('\nAll using cash register metallic sound with inharmonic overtones');
console.log(`\nOutput directory: ${outputDir}`);

























