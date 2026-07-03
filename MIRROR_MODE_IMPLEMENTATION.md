# Mirror Work Implementation Documentation

## Overview
Mirror Work is a camera-based affirmation practice tool that provides real-time volume-based feedback to users as they speak affirmations.

## Key Principles

### Volume-Only Meter
- **The meter is PURELY based on voice volume**
- **NO face detection** - All face detection code has been removed
- **NO eye contact tracking** - Eye contact is not used in any calculations
- The meter reflects only the user's voice volume converted to decibels

### Volume Detection Mechanism

1. **Audio Collection**
   - Uses Web Audio API `AnalyserNode` with time domain data
   - Samples collected every 100ms
   - Calculates RMS (Root Mean Square) from audio waveform

2. **Volume Calculation**
   - RMS values are converted to decibels using: `dB = 20 * log10(rms / reference)`
   - Reference value: `0.000003` (maps RMS of 0.3 to 100 dB)
   - Decibels are scaled so **100 dB = 100% on the meter**
   - Clamped to 0-100 dB range

3. **Silence Filtering**
   - RMS values below 0.02 are treated as silence/background noise
   - Silence adds 0 to the history (doesn't clear history)

4. **Smoothing/Averaging**
   - **Simple averaging only** - NO exponential moving average (EMA)
   - **NO weighted calculations** (no 40%/60%, 70%/30% old/new ratios)
   - Collects last 25 samples (2.5 seconds at 100ms intervals)
   - Calculates simple average: `sum of all samples / number of samples`

5. **Meter Update Frequency**
   - Meter updates every **2.5 seconds** based on average of collected samples
   - Holds the assessment for 2.5 seconds, then reassesses
   - Provides immediate feedback after first 5 samples (for initial responsiveness)

### Meter Display

- **Always visible** when camera is active (no conditional rendering based on confidence)
- Shows as a white progress bar inside a black rounded container
- Minimum width: 1% (to ensure visibility even at 0%)
- Positioned at bottom of video feed
- Feedback messages appear above the meter

### Feedback Messages

- Generated every 7 seconds based on volume level
- Uses the averaged confidence value from volume history
- Three tiers:
  - **Low (< 30%)**: "A little louder!", "Speak it into existence!", "Speak Up!", "Affirm it!"
  - **Mid (30-70%)**: "That's better.", "Keep going!", "You can do it!", "You've got this!"
  - **High (> 70%)**: "That's it.", "Perfect!", "Great energy!", "Carry that forward."

## Technical Implementation

### State Management
- `confidence`: Current meter value (0-1, based on volume only)
- `volumeHistoryRef`: Array of last 25 volume samples
- `lastMeterUpdateRef`: Timestamp of last meter update (for 2.5s interval)
- `lastFeedbackTimeRef`: Timestamp of last feedback message (for 7s interval)

### Audio Context
- Initialized when camera becomes active
- Uses `getByteTimeDomainData` (NOT frequency data)
- Analyzer settings: `fftSize: 256`, `smoothingTimeConstant: 0.8`

### Detection Loop
- Runs every 100ms to collect samples
- Updates meter every 2.5 seconds
- Generates feedback every 7 seconds

## Important Notes

1. **DO NOT add face detection** - It has been completely removed
2. **DO NOT use eye contact** - Not part of the confidence calculation
3. **DO NOT use weighted averages** - Only simple averaging
4. **DO NOT use exponential moving average** - User explicitly requested removal
5. **Meter must always be visible** - No conditional hiding based on confidence
6. **100 dB = 100% on meter** - This is the scaling target
7. **2.5 second assessment window** - Meter holds value for 2.5 seconds before reassessing

## File Location
`src/pages/features/MirrorRehearsal.tsx`

## Key Functions
- `detectVolume()`: Main volume detection function (runs every 100ms)
- `startCamera()`: Initializes camera and audio context
- `stopCamera()`: Cleans up camera, audio, and resets all state










































