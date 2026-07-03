import { LucideProps } from "lucide-react";

export const BeliefRefactorTree = ({ className, style, strokeWidth = 2, color, ...props }: LucideProps) => {
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
      {/* Base horizontal line (thick) */}
      <line x1="8" y1="22" x2="16" y2="22" strokeWidth={strokeWidth * 1.2} />
      
      {/* Central vertical trunk (thick) */}
      <line x1="12" y1="22" x2="12" y2="10" strokeWidth={strokeWidth * 1.2} />
      
      {/* Lower main branches (from lower-middle section of trunk) */}
      {/* Left lower main branch */}
      <line x1="12" y1="14" x2="6" y2="10" />
      {/* Right lower main branch */}
      <line x1="12" y1="14" x2="18" y2="10" />
      
      {/* Lower branch splits - Left side */}
      {/* Inner left branch (extends more vertically) */}
      <line x1="6" y1="10" x2="5" y2="6" />
      {/* Outer left branch (extends further diagonally) */}
      <line x1="6" y1="10" x2="3" y2="8" />
      
      {/* Lower branch splits - Right side */}
      {/* Inner right branch (extends more vertically) */}
      <line x1="18" y1="10" x2="19" y2="6" />
      {/* Outer right branch (extends further diagonally) */}
      <line x1="18" y1="10" x2="21" y2="8" />
      
      {/* Upper branches (from upper part of trunk) - do not split */}
      {/* Left upper branch */}
      <line x1="12" y1="10" x2="8" y2="6" />
      {/* Right upper branch */}
      <line x1="12" y1="10" x2="16" y2="6" />
      {/* Additional upper branches for 8 total terminals */}
      <line x1="12" y1="10" x2="10" y2="4" />
      <line x1="12" y1="10" x2="14" y2="4" />
      
      {/* Terminal circles (8 total - hollow, uniform size) */}
      {/* Lower left circles (2 from split branches) */}
      <circle cx="5" cy="6" r="1.5" fill="none" />
      <circle cx="3" cy="8" r="1.5" fill="none" />
      {/* Lower right circles (2 from split branches) */}
      <circle cx="19" cy="6" r="1.5" fill="none" />
      <circle cx="21" cy="8" r="1.5" fill="none" />
      {/* Upper left circle (from upper branch) */}
      <circle cx="8" cy="6" r="1.5" fill="none" />
      {/* Upper right circle (from upper branch) */}
      <circle cx="16" cy="6" r="1.5" fill="none" />
      {/* Top left circle (additional upper branch) */}
      <circle cx="10" cy="4" r="1.5" fill="none" />
      {/* Top right circle (additional upper branch) */}
      <circle cx="14" cy="4" r="1.5" fill="none" />
    </svg>
  );
};

