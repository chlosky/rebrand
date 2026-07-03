import type { Note } from "@/pages/features/MusicComposer";

export class MusicNoteParser {
  // Note frequencies in Hz (A4 = 440Hz)
  private readonly NOTE_FREQUENCIES: { [key: string]: number } = {
    'C': 261.63,
    'C#': 277.18,
    'Db': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'Eb': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'Gb': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'Ab': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'Bb': 466.16,
    'B': 493.88,
  };

  /**
   * Parse a string of music notes into Note objects
   * Supports formats like:
   * - "C4, D4, E4" (comma-separated)
   * - "C4\nD4\nE4" (line-separated)
   * - "C4 D4 E4" (space-separated)
   */
  parse(input: string): Note[] {
    if (!input.trim()) {
      return [];
    }

    // Split by comma, newline, or space
    const noteStrings = input
      .split(/[,\n\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const notes: Note[] = [];
    let currentTime = 0;
    const defaultDuration = 0.5; // 0.5 seconds per note

    noteStrings.forEach((noteString) => {
      try {
        const parsed = this.parseNote(noteString);
        if (parsed) {
          notes.push({
            note: parsed.note,
            duration: parsed.duration || defaultDuration,
            startTime: currentTime,
          });
          currentTime += parsed.duration || defaultDuration;
        }
      } catch (error) {
        console.warn(`Failed to parse note: ${noteString}`, error);
      }
    });

    return notes;
  }

  /**
   * Parse a single note string
   * Formats supported:
   * - "C4" (note + octave)
   * - "C#4" (note with sharp + octave)
   * - "C4:1.0" (note + octave + duration)
   */
  private parseNote(noteString: string): { note: string; duration?: number } | null {
    // Remove whitespace
    noteString = noteString.trim().toUpperCase();

    // Check for duration (format: "C4:1.0")
    let duration: number | undefined;
    if (noteString.includes(':')) {
      const parts = noteString.split(':');
      noteString = parts[0];
      duration = parseFloat(parts[1]);
      if (isNaN(duration) || duration <= 0) {
        throw new Error(`Invalid duration: ${parts[1]}`);
      }
    }

    // Match note pattern: (note)(optional sharp/flat)(octave)
    const match = noteString.match(/^([A-G])([#B]|B)?(\d+)$/);
    if (!match) {
      throw new Error(`Invalid note format: ${noteString}`);
    }

    const [, baseNote, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    if (octave < 0 || octave > 8) {
      throw new Error(`Invalid octave: ${octave} (must be 0-8)`);
    }

    // Build note name
    let noteName = baseNote;
    if (accidental) {
      if (accidental === '#') {
        noteName += '#';
      } else if (accidental === 'B' || accidental === 'b') {
        // Handle flat notation (B = flat in some contexts, but here we'll use b)
        // For simplicity, we'll treat 'B' after note as flat
        if (baseNote === 'B') {
          // Bb is actually A#
          noteName = 'A#';
        } else {
          // Convert flat to sharp equivalent
          const flatToSharp: { [key: string]: string } = {
            'Db': 'C#',
            'Eb': 'D#',
            'Gb': 'F#',
            'Ab': 'G#',
            'Bb': 'A#',
          };
          noteName = flatToSharp[baseNote + 'b'] || noteName + 'b';
        }
      }
    }

    const fullNote = `${noteName}${octave}`;

    // Validate note exists
    if (!this.NOTE_FREQUENCIES[noteName]) {
      throw new Error(`Invalid note: ${noteName}`);
    }

    return { note: fullNote, duration };
  }

  /**
   * Get frequency for a note (e.g., "C4")
   */
  getFrequency(note: string): number {
    const match = note.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid note format: ${note}`);
    }

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const baseFreq = this.NOTE_FREQUENCIES[noteName];

    if (!baseFreq) {
      throw new Error(`Invalid note name: ${noteName}`);
    }

    // Calculate frequency based on octave
    // The base frequencies are for octave 4 (A4 = 440Hz)
    // For other octaves, multiply by 2^(octave difference)
    const octaveDiff = octave - 4;
    const frequency = baseFreq * Math.pow(2, octaveDiff);
    
    // Ensure frequency is valid (positive and reasonable)
    if (frequency <= 0 || frequency > 20000 || isNaN(frequency) || !isFinite(frequency)) {
      throw new Error(`Invalid frequency calculated for ${note}: ${frequency} Hz`);
    }
    
    return frequency;
  }
}

