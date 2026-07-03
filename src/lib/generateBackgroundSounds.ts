// Generate background sounds programmatically
export class BackgroundSoundGenerator {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Generate rain sound using filtered white noise
  generateRain(duration: number, sampleRate?: number): AudioBuffer {
    const targetSampleRate = sampleRate || this.audioContext.sampleRate;
    const length = targetSampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, targetSampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      // Generate white noise
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Apply low-pass filter effect for rain sound
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.7 + data[i - 1] * 0.3;
      }
    }

    return buffer;
  }

  // Generate ocean waves using multiple sine waves
  generateOcean(duration: number, sampleRate?: number): AudioBuffer {
    const targetSampleRate = sampleRate || this.audioContext.sampleRate;
    const length = targetSampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, targetSampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        
        for (let i = 0; i < length; i++) {
          const t = i / targetSampleRate;
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

    return buffer;
  }

  // Generate forest ambience (birds + wind)
  generateForest(duration: number, sampleRate?: number): AudioBuffer {
    const targetSampleRate = sampleRate || this.audioContext.sampleRate;
    const length = targetSampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, targetSampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      // Wind sound (filtered noise)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      // Low-pass filter for wind
      for (let i = 1; i < length; i++) {
        data[i] = data[i] * 0.5 + data[i - 1] * 0.5;
      }

      // Add occasional bird chirps (random high frequency bursts)
      for (let i = 0; i < length; i += Math.floor(Math.random() * targetSampleRate * 2) + targetSampleRate) {
        const chirpLength = Math.floor(targetSampleRate * 0.2);
        for (let j = 0; j < chirpLength && i + j < length; j++) {
          const t = j / targetSampleRate;
          data[i + j] += Math.sin(2 * Math.PI * (2000 + Math.random() * 1000) * t) * 0.2 * Math.exp(-t * 10);
        }
      }
    }

    return buffer;
  }

  // Generate white noise
  generateWhiteNoise(duration: number, sampleRate?: number): AudioBuffer {
    const targetSampleRate = sampleRate || this.audioContext.sampleRate;
    const length = targetSampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, targetSampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    return buffer;
  }

  // Generate ambient music (simple chord progression)
  generateAmbient(duration: number, sampleRate?: number): AudioBuffer {
    const targetSampleRate = sampleRate || this.audioContext.sampleRate;
    const length = targetSampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, targetSampleRate);

    // Ambient chord frequencies
    const chords = [
      [130.81, 164.81, 196.00], // C major
      [146.83, 174.61, 220.00], // D minor
      [164.81, 196.00, 246.94], // E minor
      [174.61, 220.00, 261.63], // F major
    ];

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      let chordIndex = 0;
      const chordDuration = targetSampleRate * 4; // 4 seconds per chord

      for (let i = 0; i < length; i++) {
        const t = i / targetSampleRate;
        
        // Change chord every 4 seconds
        if (i % chordDuration === 0) {
          chordIndex = (chordIndex + 1) % chords.length;
        }

        const chord = chords[chordIndex];
        const envelope = 0.3 * (1 - Math.cos(2 * Math.PI * t / 4)); // Slow fade in/out
        
        // Sum all notes in chord
        data[i] = chord.reduce((sum, freq) => {
          return sum + Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
        }, 0);
      }
    }

    return buffer;
  }
}
