import type { ReactNode } from "react";

function IconCanvas({ filterId, children }: { filterId: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 52 52"
      className="h-[3.25rem] w-[3.25rem] shrink-0 overflow-visible"
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {children}
    </svg>
  );
}

/** Card 1 — glass speech bubble + iridescent heart */
export function WelcomeIconChooseDesire() {
  const glow = "welcome-desire-glow";
  return (
    <IconCanvas filterId={glow}>
      <rect x="6" y="10" width="30" height="24" rx="7" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.85" />
      <path d="M18 34 L14 40 L22 34 Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" strokeWidth="0.65" strokeLinejoin="round" />
      <line x1="13" y1="18" x2="29" y2="18" stroke="rgba(255,255,255,0.58)" strokeWidth="1.05" strokeLinecap="round" />
      <line x1="13" y1="22.5" x2="27" y2="22.5" stroke="rgba(255,255,255,0.44)" strokeWidth="1.05" strokeLinecap="round" />
      <line x1="13" y1="27" x2="24" y2="27" stroke="rgba(255,255,255,0.32)" strokeWidth="1.05" strokeLinecap="round" />
      <defs>
        <linearGradient id="welcomeHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8d4e8" />
          <stop offset="45%" stopColor="#e8a8c8" />
          <stop offset="100%" stopColor="#d090b8" />
        </linearGradient>
      </defs>
      <path
        d="M34 30 C34 26.5 37 24 39.5 26 C42 24 45 26.5 45 30 C45 34 39.5 38 39.5 38 C39.5 38 34 34 34 30 Z"
        fill="url(#welcomeHeartGrad)"
        stroke="rgba(255,225,240,0.55)"
        strokeWidth="0.55"
        filter={`url(#${glow})`}
      />
    </IconCanvas>
  );
}

/** Card 2 — overlapping glowing lavender/white sine waves (mock style) */
export function WelcomeIconMakeYours() {
  const glow = "welcome-waves-glow";
  const waves = [
    { d: "M5 24 C13 17, 21 17, 29 24 S45 31, 47 24", stroke: "rgba(255,255,255,0.95)", width: 1.3 },
    { d: "M4 30 C12 23, 20 23, 28 30 S44 37, 48 30", stroke: "#ead8f0", width: 1.15 },
    { d: "M7 36 C14 30, 22 30, 30 36 S42 42, 46 36", stroke: "rgba(255,255,255,0.52)", width: 1 },
    { d: "M8 18 C15 13, 23 13, 31 18 S43 23, 45 18", stroke: "#f0c8e0", width: 0.95 },
    { d: "M6 12 C14 8, 22 8, 30 12 S42 16, 46 12", stroke: "rgba(255,255,255,0.28)", width: 0.85 },
  ] as const;

  return (
    <IconCanvas filterId={glow}>
      {waves.map((wave, i) => (
        <path
          key={i}
          d={wave.d}
          fill="none"
          stroke={wave.stroke}
          strokeWidth={wave.width}
          strokeLinecap="round"
          filter={`url(#${glow})`}
        />
      ))}
    </IconCanvas>
  );
}

/** Card 3 — glowing orb + play + floating notes */
export function WelcomeIconListenRepeat() {
  const glow = "welcome-play-glow";
  return (
    <IconCanvas filterId={glow}>
      <defs>
        <radialGradient id="welcomeOrbGrad" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.38)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </radialGradient>
      </defs>
      <circle cx="26" cy="27" r="14" fill="url(#welcomeOrbGrad)" stroke="rgba(255,255,255,0.26)" strokeWidth="0.85" filter={`url(#${glow})`} />
      <path d="M22 21 L22 33 L32 27 Z" fill="rgba(255,255,255,0.94)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.45" strokeLinejoin="round" />
      <ellipse cx="40" cy="14" rx="2.1" ry="1.5" fill="rgba(255,255,255,0.52)" transform="rotate(-16 40 14)" filter={`url(#${glow})`} />
      <path d="M40 15.4 L40 20.5" stroke="rgba(255,255,255,0.48)" strokeWidth="0.85" strokeLinecap="round" />
      <ellipse cx="11" cy="38" rx="1.7" ry="1.25" fill="rgba(255,255,255,0.42)" transform="rotate(14 11 38)" filter={`url(#${glow})`} />
      <path d="M11 39.1 L11 43.2" stroke="rgba(255,255,255,0.36)" strokeWidth="0.75" strokeLinecap="round" />
    </IconCanvas>
  );
}
