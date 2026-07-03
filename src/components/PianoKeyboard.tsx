import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PianoKeyboardProps {
  onNotePlay: (note: string, position?: { x: number; y: number }) => void;
  onNoteStart?: (note: string) => void;
  onNoteStop?: (note: string) => void;
  octaves?: number;
  startOctave?: number;
  activeColor?: string; // Color for pressed keys
}

// Piano key layout: white and black keys
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

// Black key positions relative to white keys
const BLACK_KEY_POSITIONS: { [key: string]: number } = {
  'C#': 0.6, // Between C and D
  'D#': 1.6, // Between D and E
  'F#': 3.6, // Between F and G
  'G#': 4.6, // Between G and A
  'A#': 5.6, // Between A and B
};

export function PianoKeyboard({ 
  onNotePlay, 
  onNoteStart,
  onNoteStop,
  octaves = 2, 
  startOctave = 3,
  activeColor
}: PianoKeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const keysContainerRef = useRef<HTMLDivElement>(null);
  const activePointerToNoteRef = useRef<Map<number, string>>(new Map());
  const glissandoActiveRef = useRef<Map<number, Set<string>>>(new Map()); // Track notes played during glissando
  const isMobile = useIsMobile();
  
  // Adjust octaves for mobile vs desktop - allow more octaves on mobile with vertical layout
  const displayOctaves = isMobile ? Math.min(octaves, 4) : octaves;

  // Calculate key position from note name
  const getKeyPosition = (fullNote: string): { x: number; y: number } | null => {
    if (!keysContainerRef.current) return null;
    
    const rect = keysContainerRef.current.getBoundingClientRect();
    const noteMatch = fullNote.match(/^([A-G]#?)(\d+)$/);
    if (!noteMatch) return null;
    
    const note = noteMatch[1];
    const octave = parseInt(noteMatch[2]);
    
    if (octave < startOctave || octave >= startOctave + displayOctaves) return null;
    
    if (isMobile) {
      // Vertical layout
      const WHITE_KEY_HEIGHT = 45;
      const whiteKeyIndex = WHITE_KEYS.indexOf(note);
      if (whiteKeyIndex === -1) {
        // Black key
        const blackKeyIndex = BLACK_KEYS.indexOf(note);
        if (blackKeyIndex === -1) return null;
        const blackKeyPos = BLACK_KEY_POSITIONS[note];
        const octaveOffset = (octave - startOctave) * 7;
        const keyIndex = octaveOffset + Math.floor(blackKeyPos);
        const basePosition = keyIndex * WHITE_KEY_HEIGHT;
        const offset = (blackKeyPos % 1) * WHITE_KEY_HEIGHT;
        const topPosition = basePosition + offset;
        return {
          x: rect.width * 0.7, // Right side for black keys
          y: topPosition + 15, // Center of black key
        };
      } else {
        // White key
        const octaveOffset = (octave - startOctave) * 7;
        const keyIndex = octaveOffset + whiteKeyIndex;
        return {
          x: rect.width / 2, // Center horizontally
          y: keyIndex * WHITE_KEY_HEIGHT + WHITE_KEY_HEIGHT / 2, // Center of key
        };
      }
    } else {
      // Horizontal layout
      const totalWhiteKeys = displayOctaves * 7;
      const whiteKeyWidth = rect.width / totalWhiteKeys;
      const whiteKeyIndex = WHITE_KEYS.indexOf(note);
      
      if (whiteKeyIndex === -1) {
        // Black key
        const blackKeyIndex = BLACK_KEYS.indexOf(note);
        if (blackKeyIndex === -1) return null;
        const blackKeyPos = BLACK_KEY_POSITIONS[note];
        const octaveOffset = (octave - startOctave) * 7;
        const whiteKeyOffset = octaveOffset + Math.floor(blackKeyPos);
        const percentPerKey = 100 / totalWhiteKeys;
        const basePosition = whiteKeyOffset * percentPerKey;
        const offset = (blackKeyPos % 1) * percentPerKey;
        const leftPosition = (basePosition + offset - 1.75) * rect.width / 100;
        return {
          x: leftPosition + 14, // Center of black key (28px wide)
          y: 60, // Middle of black key height
        };
      } else {
        // White key
        const octaveOffset = (octave - startOctave) * 7;
        const keyIndex = octaveOffset + whiteKeyIndex;
        return {
          x: keyIndex * whiteKeyWidth + whiteKeyWidth / 2, // Center of key
          y: 100, // Middle of white key height
        };
      }
    }
  };

  const pressNote = (fullNote: string) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.add(fullNote);
      return next;
    });
    const position = getKeyPosition(fullNote);
    onNotePlay(fullNote, position || undefined);
  };

  const releaseNote = (fullNote: string) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(fullNote);
      return next;
    });
    if (onNoteStop) {
      onNoteStop(fullNote);
    }
  };

  // Find which key is at a given coordinate
  const findKeyAtPosition = (x: number, y: number): string | null => {
    if (!keysContainerRef.current) return null;
    
    const rect = keysContainerRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    if (isMobile) {
      // Vertical layout: find key based on Y position
      const WHITE_KEY_HEIGHT = 45;
      const totalWhiteKeys = displayOctaves * 7;
      const keyIndex = Math.floor(relativeY / WHITE_KEY_HEIGHT);
      
      if (keyIndex < 0 || keyIndex >= totalWhiteKeys) return null;
      
      const octave = Math.floor(keyIndex / 7) + startOctave;
      const noteIndex = keyIndex % 7;
      const note = WHITE_KEYS[noteIndex];
      
      // Check if we're over a black key (they're on the right side)
      if (relativeX > rect.width * 0.4) {
        // Check black keys
        const keyPositionInOctave = keyIndex % 7;
        const blackKeyPositions = [
          { note: 'C#', pos: 0.6 },
          { note: 'D#', pos: 1.6 },
          { note: 'F#', pos: 3.6 },
          { note: 'G#', pos: 4.6 },
          { note: 'A#', pos: 5.6 },
        ];
        
        for (const blackKey of blackKeyPositions) {
          const blackKeyIndex = Math.floor(blackKey.pos);
          if (blackKeyIndex === keyPositionInOctave) {
            const offset = (blackKey.pos % 1) * WHITE_KEY_HEIGHT;
            const blackKeyTop = (keyIndex - (keyIndex % 7)) * WHITE_KEY_HEIGHT + offset - 15;
            const blackKeyBottom = blackKeyTop + 30;
            
            if (relativeY >= blackKeyTop && relativeY <= blackKeyBottom) {
              return `${blackKey.note}${octave}`;
            }
          }
        }
      }
      
      return `${note}${octave}`;
    } else {
      // Horizontal layout: find key based on X position
      const totalWhiteKeys = displayOctaves * 7;
      const whiteKeyWidth = rect.width / totalWhiteKeys;
      const whiteKeyIndex = Math.floor(relativeX / whiteKeyWidth);
      
      if (whiteKeyIndex < 0 || whiteKeyIndex >= totalWhiteKeys) return null;
      
      const octave = Math.floor(whiteKeyIndex / 7) + startOctave;
      const noteIndex = whiteKeyIndex % 7;
      const note = WHITE_KEYS[noteIndex];
      
      // Check if we're over a black key (they're above white keys)
      if (relativeY < 120) {
        const keyPositionInOctave = whiteKeyIndex % 7;
        const blackKeyPositions = [
          { note: 'C#', pos: 0.6 },
          { note: 'D#', pos: 1.6 },
          { note: 'F#', pos: 3.6 },
          { note: 'G#', pos: 4.6 },
          { note: 'A#', pos: 5.6 },
        ];
        
        for (const blackKey of blackKeyPositions) {
          const blackKeyIndex = Math.floor(blackKey.pos);
          if (blackKeyIndex === keyPositionInOctave) {
            const percentPerKey = 100 / totalWhiteKeys;
            const octaveOffset = (octave - startOctave) * 7;
            const whiteKeyOffset = octaveOffset + blackKeyIndex;
            const basePosition = whiteKeyOffset * percentPerKey;
            const offset = (blackKey.pos % 1) * percentPerKey;
            const leftPosition = (basePosition + offset - 1.75) * rect.width / 100;
            const rightPosition = leftPosition + 28;
            
            if (relativeX >= leftPosition && relativeX <= rightPosition) {
              return `${blackKey.note}${octave}`;
            }
          }
        }
      }
      
      return `${note}${octave}`;
    }
  };

  // Handle pointer move for glissando
  const handlePointerMove = (e: React.PointerEvent) => {
    // Only handle if this pointer is active (being dragged)
    if (!activePointerToNoteRef.current.has(e.pointerId)) return;
    
    const key = findKeyAtPosition(e.clientX, e.clientY);
    if (!key) {
      // If we moved outside the keyboard area, release the current note
      const currentNote = activePointerToNoteRef.current.get(e.pointerId);
      if (currentNote) {
        releaseNote(currentNote);
        activePointerToNoteRef.current.delete(e.pointerId);
        glissandoActiveRef.current.delete(e.pointerId);
      }
      return;
    }
    
    // Get or create the set of notes played for this pointer
    if (!glissandoActiveRef.current.has(e.pointerId)) {
      glissandoActiveRef.current.set(e.pointerId, new Set());
    }
    const playedNotes = glissandoActiveRef.current.get(e.pointerId)!;
    
    // Get current note for this pointer
    const currentNote = activePointerToNoteRef.current.get(e.pointerId);
    
    // If we're on a different key, release the previous one and play the new one
    if (currentNote !== key) {
      // Release previous note if it exists
      if (currentNote) {
        releaseNote(currentNote);
      }
      // Update active note and play new one
      activePointerToNoteRef.current.set(e.pointerId, key);
      playedNotes.add(key);
      pressNote(key);
    }
  };

  // Handle pointer up at container level to ensure keys are released
  const handlePointerUp = (e: React.PointerEvent) => {
    const fullNote = activePointerToNoteRef.current.get(e.pointerId);
    if (fullNote) {
      releaseNote(fullNote);
      activePointerToNoteRef.current.delete(e.pointerId);
      glissandoActiveRef.current.delete(e.pointerId);
    }
    // Release pointer capture
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Handle pointer cancel at container level
  const handlePointerCancel = (e: React.PointerEvent) => {
    const fullNote = activePointerToNoteRef.current.get(e.pointerId);
    if (fullNote) {
      releaseNote(fullNote);
      activePointerToNoteRef.current.delete(e.pointerId);
      glissandoActiveRef.current.delete(e.pointerId);
    }
    // Release pointer capture
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger piano notes when user is typing in input fields
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      )) {
        return; // Let the input handle the keypress
      }

      // Map keyboard keys to piano notes
      // White keys: Tab to backslash (left to right)
      // Black keys: a to semicolon (left to right)
      const keyMap: { [key: string]: { note: string; octave: number } } = {
        // White keys - Octave 3
        'tab': { note: 'C', octave: 3 },
        'q': { note: 'D', octave: 3 },
        'w': { note: 'E', octave: 3 },
        'e': { note: 'F', octave: 3 },
        'r': { note: 'G', octave: 3 },
        't': { note: 'A', octave: 3 },
        'y': { note: 'B', octave: 3 },
        // White keys - Octave 4
        'u': { note: 'C', octave: 4 },
        'i': { note: 'D', octave: 4 },
        'o': { note: 'E', octave: 4 },
        'p': { note: 'F', octave: 4 },
        '[': { note: 'G', octave: 4 },
        ']': { note: 'A', octave: 4 },
        '\\': { note: 'B', octave: 4 },
        // Black keys - Octave 3
        'a': { note: 'C#', octave: 3 },
        's': { note: 'D#', octave: 3 },
        'd': { note: 'F#', octave: 3 },
        'f': { note: 'G#', octave: 3 },
        'g': { note: 'A#', octave: 3 },
        // Black keys - Octave 4
        'h': { note: 'C#', octave: 4 },
        'j': { note: 'D#', octave: 4 },
        'k': { note: 'F#', octave: 4 },
        'l': { note: 'G#', octave: 4 },
        ';': { note: 'A#', octave: 4 },
      };

      // Handle special keys that don't lowercase properly
      let keyToCheck = e.key.toLowerCase();
      if (e.key === 'Tab') keyToCheck = 'tab';
      if (e.key === '\\' || e.key === 'Backslash') keyToCheck = '\\';
      
      const mapping = keyMap[keyToCheck];
      if (mapping && !e.repeat) {
        e.preventDefault();
        const fullNote = `${mapping.note}${mapping.octave}`;
        setPressedKeys(prev => new Set(prev).add(fullNote));
        const position = getKeyPosition(fullNote);
        onNotePlay(fullNote, position || undefined);
        
        const timeoutId = setTimeout(() => {
          setPressedKeys(prev => {
            const next = new Set(prev);
            next.delete(fullNote);
            return next;
          });
        }, 150);
        
        // Clean up on keyup to ensure key is released
        const handleKeyUp = (upEvent: KeyboardEvent) => {
          // Normalize keys the same way as keydown
          let upKeyToCheck = upEvent.key.toLowerCase();
          if (upEvent.key === 'Tab') upKeyToCheck = 'tab';
          if (upEvent.key === '\\' || upEvent.key === 'Backslash') upKeyToCheck = '\\';
          
          if (upKeyToCheck === keyToCheck) {
            setPressedKeys(prev => {
              const next = new Set(prev);
              next.delete(fullNote);
              return next;
            });
            clearTimeout(timeoutId);
            window.removeEventListener('keyup', handleKeyUp);
          }
        };
        window.addEventListener('keyup', handleKeyUp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startOctave, onNotePlay]);

  const renderKeys = () => {
    const keys: JSX.Element[] = [];
    let whiteKeyIndex = 0;
    const WHITE_KEY_HEIGHT = 45; // Height of each white key in pixels for mobile

    for (let octave = startOctave; octave < startOctave + displayOctaves; octave++) {
      // Render white keys
      WHITE_KEYS.forEach((note, index) => {
        const fullNote = `${note}${octave}`;
        const isPressed = pressedKeys.has(fullNote);
        
        keys.push(
          <button
            key={`white-${fullNote}`}
            className={cn(
              "relative bg-white border border-gray-300",
              "hover:bg-gray-100 active:bg-gray-200",
              "transition-all duration-200",
              "touch-none select-none",
              isMobile 
                ? "w-full rounded-r-md" 
                : "flex-1 min-w-[40px] h-[200px] rounded-b-md",
              isPressed && !activeColor && "bg-gray-300"
            )}
            style={{
              ...(isMobile ? {
                height: `${WHITE_KEY_HEIGHT}px`,
                zIndex: 1,
              } : {
                marginLeft: '0',
                zIndex: 1,
              }),
              ...(isPressed && activeColor ? {
                backgroundColor: `${activeColor}40`,
                borderColor: `${activeColor}CC`,
                borderWidth: '2px',
                boxShadow: `0 0 30px ${activeColor}80, inset 0 0 20px ${activeColor}50`,
              } : {})
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              const fullNote = `${note}${octave}`;
              activePointerToNoteRef.current.set(e.pointerId, fullNote);
              glissandoActiveRef.current.set(e.pointerId, new Set([fullNote]));
              pressNote(fullNote);
              // Capture pointer on the container for glissando
              if (containerRef.current) {
                (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
              }
            }}
            onPointerUp={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
          >
            <span className={cn(
              "absolute text-xs text-gray-500",
              isMobile 
                ? "left-2 top-1/2 transform -translate-y-1/2" 
                : "bottom-2 left-1/2 transform -translate-x-1/2"
            )}>
              {note}{octave}
            </span>
          </button>
        );
        whiteKeyIndex++;
      });

      // Render black keys for this octave (except between E-F and B-C)
      BLACK_KEYS.forEach((note) => {
        const fullNote = `${note}${octave}`;
        const isPressed = pressedKeys.has(fullNote);
        const position = BLACK_KEY_POSITIONS[note];
        
        if (isMobile) {
          // Vertical layout: calculate top position in pixels
          const whiteKeyBefore = Math.floor(position);
          const octaveOffset = (octave - startOctave) * 7;
          const keyIndex = octaveOffset + whiteKeyBefore;
          // Calculate position: base position of the white key + offset within that key
          const basePosition = keyIndex * WHITE_KEY_HEIGHT;
          const offset = (position % 1) * WHITE_KEY_HEIGHT;
          const topPosition = basePosition + offset - 15; // Center the black key (30px height / 2 = 15px)
          
          keys.push(
            <button
              key={`black-${fullNote}`}
              className={cn(
                "absolute bg-gray-900 border border-gray-700 rounded-l-md",
                "hover:bg-gray-800 active:bg-gray-700",
                "transition-all duration-200",
                "touch-none select-none",
                "h-[30px] w-[60%] z-10",
                isPressed && !activeColor && "bg-gray-700"
              )}
              style={{
                top: `${topPosition}px`,
                right: '0',
                ...(isPressed && activeColor ? {
                  backgroundColor: `${activeColor}FF`,
                  borderColor: `${activeColor}FF`,
                  borderWidth: '2px',
                  boxShadow: `0 0 25px ${activeColor}AA, inset 0 0 15px ${activeColor}80`,
                } : {})
              }}
              onPointerDown={(e) => {
              e.preventDefault();
              const fullNote = `${note}${octave}`;
              activePointerToNoteRef.current.set(e.pointerId, fullNote);
              glissandoActiveRef.current.set(e.pointerId, new Set([fullNote]));
              pressNote(fullNote);
              // Capture pointer on the container for glissando
              if (containerRef.current) {
                (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
              }
            }}
            onPointerUp={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            />
          );
        } else {
          // Horizontal layout: calculate left position
          const whiteKeyBefore = Math.floor(position);
          const totalWhiteKeys = displayOctaves * 7;
          // Calculate position within the current octave
          const octaveOffset = (octave - startOctave) * 7;
          const whiteKeyOffset = octaveOffset + whiteKeyBefore;
          const percentPerKey = 100 / totalWhiteKeys;
          const basePosition = whiteKeyOffset * percentPerKey;
          const offset = (position % 1) * percentPerKey;
          const leftPosition = basePosition + offset - 1.75;
          
          keys.push(
            <button
              key={`black-${fullNote}`}
                className={cn(
                "absolute bg-gray-900 border border-gray-700 rounded-b-md",
                "hover:bg-gray-800 active:bg-gray-700",
                "transition-all duration-200",
                "touch-none select-none",
                "w-[28px] h-[120px] z-10",
                isPressed && !activeColor && "bg-gray-700"
              )}
              style={{
                left: `${leftPosition}%`,
                ...(isPressed && activeColor ? {
                  backgroundColor: `${activeColor}FF`,
                  borderColor: `${activeColor}FF`,
                  borderWidth: '2px',
                  boxShadow: `0 0 25px ${activeColor}AA, inset 0 0 15px ${activeColor}80`,
                } : {})
              }}
              onPointerDown={(e) => {
              e.preventDefault();
              const fullNote = `${note}${octave}`;
              activePointerToNoteRef.current.set(e.pointerId, fullNote);
              glissandoActiveRef.current.set(e.pointerId, new Set([fullNote]));
              pressNote(fullNote);
              // Capture pointer on the container for glissando
              if (containerRef.current) {
                (containerRef.current as HTMLElement).setPointerCapture(e.pointerId);
              }
            }}
            onPointerUp={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            onPointerCancel={(e) => {
              const fullNote = activePointerToNoteRef.current.get(e.pointerId);
              if (fullNote) {
                releaseNote(fullNote);
                activePointerToNoteRef.current.delete(e.pointerId);
                glissandoActiveRef.current.delete(e.pointerId);
              }
              // Release pointer capture
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
            />
          );
        }
      });
    }

    return keys;
  };

  return (
    <div 
      className="w-full touch-none" 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div 
        className={cn(
          "relative",
          !isMobile && "overflow-y-hidden overflow-x-visible"
        )}
        style={!isMobile ? { minHeight: '200px' } : undefined}
      >
        <div 
          ref={keysContainerRef}
          className={cn(
            "relative",
            isMobile ? "flex flex-col" : "flex"
          )}
          style={!isMobile ? { minHeight: '200px' } : undefined}
        >
          {renderKeys()}
        </div>
      </div>
    </div>
  );
}