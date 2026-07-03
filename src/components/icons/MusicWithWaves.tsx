import { LucideProps } from "lucide-react";

export const MusicWithWaves = ({ className, style, strokeWidth = 2, color, ...props }: LucideProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* 3 concentric arcs on the left side, curving inward toward the note */}
      {/* Inner arc */}
      <path
        d="M 7 12 A 1.5 2 0 0 1 9 10"
        fill="none"
      />
      {/* Middle arc */}
      <path
        d="M 5 12 A 3 3.5 0 0 1 9 8.5"
        fill="none"
      />
      {/* Outer arc */}
      <path
        d="M 3 12 A 5 5 0 0 1 9 7"
        fill="none"
      />
      
      {/* Eighth note (quaver) in the center */}
      {/* Stem */}
      <path d="M12 18V6" />
      {/* Note head (filled circle) */}
      <circle cx="12" cy="18" r="2" fill={color || "currentColor"} />
      {/* Flag curving to the right */}
      <path d="M12 6 Q13 5 14 6 Q15 7 14 8" />
      
      {/* 3 concentric arcs on the right side, curving inward toward the note */}
      {/* Inner arc */}
      <path
        d="M 17 12 A 1.5 2 0 0 0 15 10"
        fill="none"
      />
      {/* Middle arc */}
      <path
        d="M 19 12 A 3 3.5 0 0 0 15 8.5"
        fill="none"
      />
      {/* Outer arc */}
      <path
        d="M 21 12 A 5 5 0 0 0 15 7"
        fill="none"
      />
    </svg>
  );
};

