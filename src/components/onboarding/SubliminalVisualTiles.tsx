import React from "react";
import { cn } from "@/lib/utils";

type TileProps = {
  children: React.ReactNode;
  label: string;
  sublabel?: string;
  className?: string;
};

function GlassTile({ children, label, sublabel, className }: TileProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[156px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[28px] border px-4 py-5 text-center",
        "border-[rgba(238,184,255,0.30)] bg-[rgba(20,16,36,0.44)]",
        "shadow-[0_0_32px_rgba(218,126,255,0.14),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-18px_42px_rgba(78,39,116,0.16)]",
        "backdrop-blur-[22px]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,205,247,0.12),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,188,244,0.24)] to-transparent" />

      <div className="relative mb-5 flex h-[68px] w-full items-center justify-center">
        {children}
      </div>

      <div className="relative text-[18px] font-medium leading-tight tracking-[-0.01em] text-white/92">
        {label}
      </div>

      {sublabel ? (
        <div className="relative mt-1 text-[13px] leading-snug text-white/48">
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}

export function AffirmationGlassIcon() {
  return (
    <svg
      width="116"
      height="78"
      viewBox="0 0 116 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="affirmCardFill" x1="16" y1="6" x2="92" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9A4FF" stopOpacity="0.94" />
          <stop offset="0.55" stopColor="#F2B4EF" stopOpacity="0.88" />
          <stop offset="1" stopColor="#FFE5B8" stopOpacity="0.86" />
        </linearGradient>
        <linearGradient id="affirmStroke" x1="14" y1="4" x2="96" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.40" />
          <stop offset="0.5" stopColor="#F7A7DD" stopOpacity="0.42" />
          <stop offset="1" stopColor="#B792FF" stopOpacity="0.40" />
        </linearGradient>
        <linearGradient id="heartFill" x1="75" y1="42" x2="108" y2="68" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8B0DF" />
          <stop offset="0.48" stopColor="#FFE3B7" />
          <stop offset="1" stopColor="#B6A7FF" />
        </linearGradient>
        <filter id="affirmGlow" x="-20" y="-20" width="156" height="118" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.84  0 1 0 0 0.42  0 0 1 0 1  0 0 0 0.42 0"
          />
          <feBlend in="SourceGraphic" />
        </filter>
        <filter id="softHeartShadow" x="58" y="28" width="58" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#F7A7DD" floodOpacity="0.34" />
        </filter>
      </defs>

      <g filter="url(#affirmGlow)">
        <rect
          x="14"
          y="8"
          width="74"
          height="52"
          rx="13"
          fill="url(#affirmCardFill)"
          fillOpacity="0.70"
          stroke="url(#affirmStroke)"
        />
        <rect x="27" y="23" width="48" height="4.2" rx="2.1" fill="white" fillOpacity="0.82" />
        <rect x="27" y="35" width="45" height="4.2" rx="2.1" fill="white" fillOpacity="0.76" />
        <rect x="27" y="47" width="28" height="4.2" rx="2.1" fill="white" fillOpacity="0.70" />
      </g>

      <g filter="url(#softHeartShadow)">
        <path
          d="M91.7 66.8C91.1 66.2 78.9 55.6 76.6 48.7C74.9 43.6 77.7 38.5 82.7 38.1C86 37.9 88.9 39.7 90.6 42.4C92.3 39.5 95.1 37.5 98.5 37.5C103.5 37.5 106.5 42.3 105.1 47.6C103.1 55 92.3 66.2 91.7 66.8Z"
          fill="url(#heartFill)"
          fillOpacity="0.92"
        />
        <path
          d="M91.7 66.8C91.1 66.2 78.9 55.6 76.6 48.7C74.9 43.6 77.7 38.5 82.7 38.1C86 37.9 88.9 39.7 90.6 42.4C92.3 39.5 95.1 37.5 98.5 37.5C103.5 37.5 106.5 42.3 105.1 47.6C103.1 55 92.3 66.2 91.7 66.8Z"
          stroke="white"
          strokeOpacity="0.30"
        />
      </g>
    </svg>
  );
}

export function ThetaWaveIcon() {
  return (
    <svg
      width="130"
      height="78"
      viewBox="0 0 130 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="thetaMain" x1="12" y1="39" x2="118" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFA5FF" stopOpacity="0.14" />
          <stop offset="0.22" stopColor="#CFA8FF" stopOpacity="0.72" />
          <stop offset="0.52" stopColor="#F3B4EF" stopOpacity="0.94" />
          <stop offset="0.78" stopColor="#CBA5FF" stopOpacity="0.70" />
          <stop offset="1" stopColor="#BFA5FF" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="thetaMist" x1="4" y1="46" x2="126" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9B7CFF" stopOpacity="0" />
          <stop offset="0.45" stopColor="#C8A7FF" stopOpacity="0.20" />
          <stop offset="0.62" stopColor="#F8AEE4" stopOpacity="0.24" />
          <stop offset="1" stopColor="#9B7CFF" stopOpacity="0" />
        </linearGradient>
        <filter id="thetaGlow" x="-20" y="-16" width="170" height="110" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.74  0 1 0 0 0.48  0 0 1 0 1  0 0 0 0.55 0"
          />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <path
        d="M7 49C21 42 35 42 49 49C63 56 76 56 90 49C104 42 116 42 124 47"
        stroke="url(#thetaMist)"
        strokeWidth="13"
        strokeLinecap="round"
        opacity="0.75"
      />

      <path
        d="M8 41C17 41 21 23 31 23C43 23 44 58 57 58C70 58 72 20 85 20C97 20 101 41 122 41"
        stroke="url(#thetaMain)"
        strokeWidth="3.2"
        strokeLinecap="round"
        filter="url(#thetaGlow)"
      />

      <path
        d="M10 42C20 43 26 31 36 31C47 31 50 50 61 50C72 50 76 31 87 31C98 31 105 43 120 42"
        stroke="#FFFFFF"
        strokeOpacity="0.15"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlayOrbIcon() {
  return (
    <svg
      width="112"
      height="84"
      viewBox="0 0 112 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <radialGradient id="orbFill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(54 39) rotate(72) scale(47)">
          <stop stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="0.42" stopColor="#BFA5FF" stopOpacity="0.28" />
          <stop offset="0.78" stopColor="#241C3B" stopOpacity="0.82" />
          <stop offset="1" stopColor="#120F21" stopOpacity="0.92" />
        </radialGradient>
        <linearGradient id="orbStroke" x1="20" y1="4" x2="89" y2="73" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.44" />
          <stop offset="0.38" stopColor="#BFA5FF" stopOpacity="0.54" />
          <stop offset="0.72" stopColor="#F7A7DD" stopOpacity="0.60" />
          <stop offset="1" stopColor="#FFE5B8" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id="playFill" x1="47" y1="27" x2="72" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#F9B1DF" />
          <stop offset="1" stopColor="#BCA8FF" />
        </linearGradient>
        <filter id="orbGlow" x="-10" y="-18" width="132" height="122" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#D77CFF" floodOpacity="0.36" />
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0B0612" floodOpacity="0.50" />
        </filter>
        <filter id="noteGlow" x="0" y="0" width="112" height="84" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F4A7E7" floodOpacity="0.42" />
        </filter>
      </defs>

      <g filter="url(#orbGlow)">
        <circle cx="56" cy="40" r="34" fill="url(#orbFill)" stroke="url(#orbStroke)" strokeWidth="1.3" />
        <path
          d="M48 28.8C48 26.8 50.2 25.6 51.9 26.7L72.2 38.9C73.8 39.9 73.8 42.2 72.2 43.2L51.9 55.4C50.2 56.4 48 55.2 48 53.2V28.8Z"
          fill="url(#playFill)"
          fillOpacity="0.94"
        />
        <circle cx="44" cy="22" r="1.4" fill="#FFFFFF" fillOpacity="0.54" />
        <circle cx="78" cy="60" r="1.2" fill="#F7A7DD" fillOpacity="0.60" />
      </g>

      <g filter="url(#noteGlow)" opacity="0.82">
        <path
          d="M21 58V42.5L33 39.5V54.7"
          stroke="#F7A7DD"
          strokeOpacity="0.64"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="17.8" cy="59.2" rx="5.4" ry="3.7" transform="rotate(-18 17.8 59.2)" fill="#F7A7DD" fillOpacity="0.56" />
        <ellipse cx="29.8" cy="55.8" rx="5.2" ry="3.5" transform="rotate(-18 29.8 55.8)" fill="#F7A7DD" fillOpacity="0.48" />
      </g>
    </svg>
  );
}

export function SubliminalVisualTiles({
  className,
  variant = "three",
}: {
  className?: string;
  variant?: "three" | "compact";
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[760px] grid-cols-3 gap-4",
        "max-[640px]:gap-3",
        className,
      )}
    >
      <GlassTile
        label="Affirmations"
        sublabel={variant === "compact" ? undefined : "Type or record yours"}
      >
        <AffirmationGlassIcon />
      </GlassTile>

      <GlassTile
        label="Theta/Binaural"
        sublabel={variant === "compact" ? undefined : "Choose your sound"}
      >
        <ThetaWaveIcon />
      </GlassTile>

      <GlassTile
        label="Create & Listen"
        sublabel={variant === "compact" ? undefined : "Start listening"}
      >
        <PlayOrbIcon />
      </GlassTile>
    </div>
  );
}
