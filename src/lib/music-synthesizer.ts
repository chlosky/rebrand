import { MusicNoteParser } from "./music-note-parser";
import { supabase } from "@/integrations/supabase/client";

interface FreeplayParams {
  masterGain: number;
  lowpass: {
    frequency: number;
    Q: number;
  };
  limiter: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
  note: {
    attack: number;
    release: number;
    peakLevel: number;
  };
  continuous: {
    attack: number;
    sustain: number;
    release: number;
  };
  offline: {
    attack: number;
    decay: number;
    sustain: number;
    peakLevel: number;
    releaseMultiplier: number;
  };
  sampleRate: number;
}

export class MusicSynthesizer {
  private audioContext: AudioContext | null = null;
  private activeOscillators: Map<string, OscillatorNode> = new Map();
  private activeGainNodes: Map<string, GainNode> = new Map();
  private noteParser: MusicNoteParser;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private output: AudioNode | null = null;
  private params: FreeplayParams | null = null;
  private paramsPromise: Promise<FreeplayParams> | null = null;

  constructor() {
    this.noteParser = new MusicNoteParser();
    // Don't initialize audio context in constructor - wait for user interaction
  }

  /**
   * Fetch freeplay audio parameters from server
   * Uses caching to avoid multiple requests
   */
  private async getFreeplayParams(): Promise<FreeplayParams> {
    // If params already loaded, return them
    if (this.params) {
      return this.params;
    }

    // If params are being loaded, wait for that promise
    if (this.paramsPromise) {
      return this.paramsPromise;
    }

    // Start loading params
    this.paramsPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-freeplay-params");

        if (error) {
          console.error("Error fetching freeplay params:", error);
          // Return default fallback values
          return this.getDefaultParams();
        }

        if (data?.params) {
          this.params = data.params;
          return this.params;
        }

        // If no params in response, use defaults
        return this.getDefaultParams();
      } catch (error) {
        console.error("Error fetching freeplay params:", error);
        return this.getDefaultParams();
      }
    })();

    return this.paramsPromise;
  }

  /**
   * Default fallback parameters (used if server fetch fails)
   */
  private getDefaultParams(): FreeplayParams {
    return {
      masterGain: 0.9,
      lowpass: {
        frequency: 5500,
        Q: 1.0,
      },
      limiter: {
        threshold: -3,
        knee: 5,
        ratio: 4,
        attack: 0.02,
        release: 0.3,
      },
      note: {
        attack: 0.05,
        release: 0.2,
        peakLevel: 0.3,
      },
      continuous: {
        attack: 0.01,
        sustain: 0.22,
        release: 0.06,
      },
      offline: {
        attack: 0.01,
        decay: 0.06,
        sustain: 0.22,
        peakLevel: 0.35,
        releaseMultiplier: 0.25,
      },
      sampleRate: 44100,
    };
  }

  private async initAudioContext() {
    if (this.audioContext) {
      return;
    }
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Default output is speakers (fallback if chain fails)
      this.output = this.audioContext.destination;

      try {
        // Fetch parameters from server
        const params = await this.getFreeplayParams();

        // Build master audio chain: lowpass -> limiter -> master -> speakers
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = params.masterGain;

        this.lowpass = this.audioContext.createBiquadFilter();
        this.lowpass.type = "lowpass";
        this.lowpass.frequency.value = params.lowpass.frequency;
        this.lowpass.Q.value = params.lowpass.Q;

        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = params.limiter.threshold;
        this.limiter.knee.value = params.limiter.knee;
        this.limiter.ratio.value = params.limiter.ratio;
        this.limiter.attack.value = params.limiter.attack;
        this.limiter.release.value = params.limiter.release;

        // Chain: lowpass -> limiter -> master -> speakers
        this.lowpass.connect(this.limiter);
        this.limiter.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        // IMPORTANT: define the input point to the chain
        this.output = this.lowpass;
      } catch (e) {
        console.warn("Audio chain failed, falling back to destination", e);
        this.masterGain = null;
        this.lowpass = null;
        this.limiter = null;
        this.output = this.audioContext.destination;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Ensure audio context is ready (call this on first user interaction)
   */
  async ensureReady() {
    if (!this.audioContext) {
      await this.initAudioContext();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Get the audio context (for scheduling notes)
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Play a single note
   * @param note - Note in format "C4", "D#5", etc.
   * @param duration - Duration in seconds
   */
  async playNote(note: string, duration: number = 0.5) {
    // If context doesn't exist, initialize it
    if (!this.audioContext) {
      // Try to initialize, but don't wait - allows other notes to play
      this.ensureReady().then(() => {
        // Retry playing the note once context is ready
        this.playNote(note, duration);
      }).catch(() => {});
      return;
    }
    
    // On mobile, audio context is often suspended and needs to be resumed on first user interaction
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return;
      }
    }
    
    if (!this.output) return;

    // Simple one-shot note playback - no tracking, no stopping previous notes

    try {
      const frequency = this.noteParser.getFrequency(note);
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "triangle";  // Softer, less harsh than sine wave
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      const now = this.audioContext.currentTime;

      // Get parameters from server
      const params = await this.getFreeplayParams();
      const attack = params.note.attack;
      const release = params.note.release;
      const peakLevel = params.note.peakLevel;

      const end = now + duration;
      const releaseStart = Math.max(now + attack, end - release);

      // Simple attack-sustain-release envelope (no decay/sustain complexity)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakLevel, now + attack);
      gain.gain.setValueAtTime(peakLevel, releaseStart);
      gain.gain.linearRampToValueAtTime(0, end);

      osc.connect(gain);
      // route through your master chain
      gain.connect(this.output);

      osc.start(now);
      osc.stop(end);

      // Don't store one-shot notes in active maps (those are for held notes only)
      // Just clean up when done
      osc.onended = () => {
        try { gain.disconnect(); } catch {}
        try { osc.disconnect(); } catch {}
      };
    } catch (error) {
      console.error(`Failed to play note ${note}:`, error);
    }
  }

  /**
   * Start playing a note (for hold functionality)
   * @param note - Note in format "C4", "D#5", etc.
   */
  async startNote(note: string) {
    if (!this.audioContext) {
      await this.initAudioContext();
    }

    if (!this.audioContext) {
      console.error('Audio context not available');
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return;
      }
    }

    // If same note is active, stop it softly first (prevents phase/overlap artifacts)
    if (this.activeOscillators.has(note)) {
      this.stopNote(note);
    }

    if (!this.audioContext || !this.output) {
      return;
    }

    try {
      const frequency = this.noteParser.getFrequency(note);
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "triangle";  // Softer, less harsh than sine wave
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      const now = this.audioContext.currentTime;
      
      // Get parameters from server
      const params = await this.getFreeplayParams();
      const attack = params.continuous.attack;
      const sustain = params.continuous.sustain;

      // IMPORTANT: cancel any previous automation on this gain node
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0.0001, now);                 // never 0 for exp ramps
      gain.gain.exponentialRampToValueAtTime(sustain, now + attack);

      osc.connect(gain);
      // route through your master chain
      gain.connect(this.output);

      osc.start(now);

      // Store for cleanup
      this.activeOscillators.set(note, osc);
      this.activeGainNodes.set(note, gain);

      // Clean up when oscillator ends (shouldn't happen unless stopped)
      osc.onended = () => {
        this.activeOscillators.delete(note);
        this.activeGainNodes.delete(note);
        try { gain.disconnect(); } catch {}
        try { osc.disconnect(); } catch {}
      };
    } catch (error) {
      console.error(`Failed to start note ${note}:`, error);
    }
  }

  /**
   * Stop a specific note (for hold functionality)
   * @param note - Note in format "C4", "D#5", etc.
   */
  stopNote(note: string) {
    const osc = this.activeOscillators.get(note);
    const gain = this.activeGainNodes.get(note);

    if (!osc || !gain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Get parameters from server (use cached if available, otherwise use default)
    const params = this.params || this.getDefaultParams();
    const release = params.continuous.release;

    try {
      // Get the current scheduled value at this moment (not .value which is unreliable)
      // We'll use a small lookahead to get what the gain would be right now
      const currentGain = gain.gain.value; // This is the "immediate" value
      
      // Cancel all future automation
      gain.gain.cancelScheduledValues(now);
      
      // Use a safe minimum value - if currentGain is very small or 0, use 0.0001
      // Otherwise use the current value (but ensure it's not 0 for exponential ramp)
      const safeGain = Math.max(currentGain, 0.0001);
      
      // Set to current value (or safe minimum) and ramp down smoothly
      gain.gain.setValueAtTime(safeGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
      osc.stop(now + release + 0.01);
    } catch {}

    this.activeOscillators.delete(note);
    this.activeGainNodes.delete(note);
  }

  /**
   * Stop all currently playing notes
   */
  stop() {
    this.activeOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();
    this.activeGainNodes.clear();
  }

  /**
   * Generate audio from notes and return as WAV blob
   * @param notes - Array of notes with startTime and duration
   */
  async generateAudioFromNotes(notes: Array<{ note: string; startTime: number; duration: number }>): Promise<Blob> {
    try {
      if (notes.length === 0) {
        throw new Error('No notes to generate audio from');
      }

      // Filter out invalid notes and ensure all have valid startTime and duration
      const validNotes = notes.filter(note => {
        return note.startTime >= 0 && note.duration > 0 && !isNaN(note.startTime) && !isNaN(note.duration);
      });

      if (validNotes.length === 0) {
        throw new Error('No valid notes to generate audio from (all notes have invalid startTime or duration)');
      }

      // Calculate total duration
      const totalDuration = Math.max(
        ...validNotes.map(n => n.startTime + n.duration)
      ) + 0.5; // Add small buffer

      if (totalDuration <= 0 || isNaN(totalDuration)) {
        throw new Error(`Invalid total duration calculated from notes: ${totalDuration}`);
      }

      // Get parameters from server
      const params = await this.getFreeplayParams();
      const sampleRate = params.sampleRate;
      const frameCount = Math.ceil(sampleRate * totalDuration);
      
      if (frameCount <= 0 || isNaN(frameCount)) {
        throw new Error(`Invalid frame count: ${frameCount} (duration: ${totalDuration})`);
      }

      let offlineContext: OfflineAudioContext;
      try {
        offlineContext = new OfflineAudioContext(2, frameCount, sampleRate);
      } catch (e) {
        throw new Error(`Failed to create OfflineAudioContext: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Schedule all notes
      validNotes.forEach((noteData) => {
        try {
          const frequency = this.noteParser.getFrequency(noteData.note);
          if (isNaN(frequency) || frequency <= 0) {
            console.warn(`Invalid frequency for note ${noteData.note}: ${frequency}`);
            return; // Skip this note
          }

          const oscillator = offlineContext.createOscillator();
          const gainNode = offlineContext.createGain();

          oscillator.type = 'triangle';  // Softer, less harsh than sine wave
          oscillator.frequency.value = frequency;

          // ADSR envelope - use same approach as playNote for consistency
          const startTime = Math.max(0, noteData.startTime); // Ensure startTime is non-negative
          let duration = Math.max(0.1, noteData.duration); // Ensure duration is at least 0.1s
          
          const attack = params.offline.attack;
          const decay = params.offline.decay;
          const sustain = params.offline.sustain;
          const release = Math.min(0.12, Math.max(0.04, duration * params.offline.releaseMultiplier));

          const end = startTime + duration;
          const sustainStart = Math.max(startTime + attack + decay, end - release);

          // Cancel any previous automation and use exponential ramps
          gainNode.gain.cancelScheduledValues(startTime);
          gainNode.gain.setValueAtTime(0.0001, startTime);                 // never 0 for exp ramps
          gainNode.gain.exponentialRampToValueAtTime(params.offline.peakLevel, startTime + attack);
          gainNode.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
          gainNode.gain.setValueAtTime(sustain, sustainStart);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

          oscillator.connect(gainNode);
          gainNode.connect(offlineContext.destination);
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        } catch (e) {
          console.error(`Error scheduling note ${noteData.note}:`, e);
          // Continue with other notes
        }
      });

      // Render audio
      let renderedBuffer: AudioBuffer;
      try {
        renderedBuffer = await offlineContext.startRendering();
      } catch (e) {
        throw new Error(`Failed to render audio: ${e instanceof Error ? e.message : String(e)}`);
      }

      if (!renderedBuffer) {
        throw new Error('Rendered buffer is null or undefined');
      }

      // Convert to WAV blob
      try {
        return this.bufferToWave(renderedBuffer);
      } catch (e) {
        throw new Error(`Failed to convert buffer to WAV: ${e instanceof Error ? e.message : String(e)}`);
      }
    } catch (error) {
      console.error('Error in generateAudioFromNotes:', error);
      console.error('Notes that caused error:', notes);
      throw error;
    }
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private bufferToWave(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    const setString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(pos++, str.charCodeAt(i));
      }
    };

    setString('RIFF');
    view.setUint32(pos, 36 + length, true); pos += 4;
    setString('WAVE');
    setString('fmt ');
    view.setUint32(pos, 16, true); pos += 4;
    view.setUint16(pos, 1, true); pos += 2;
    view.setUint16(pos, buffer.numberOfChannels, true); pos += 2;
    view.setUint32(pos, buffer.sampleRate, true); pos += 4;
    view.setUint32(pos, buffer.sampleRate * buffer.numberOfChannels * 2, true); pos += 4;
    view.setUint16(pos, buffer.numberOfChannels * 2, true); pos += 2;
    view.setUint16(pos, 16, true); pos += 2;
    setString('data');
    view.setUint32(pos, length, true); pos += 4;

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Change the waveform type for future notes
   * @param type - 'sine', 'triangle', 'sawtooth', or 'square'
   */
  setWaveform(type: OscillatorType) {
    // This would be used if we stored waveform preference
    // For now, we use 'sine' by default
  }
}
