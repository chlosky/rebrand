import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Milliseconds between characters, or a function of how many characters are visible so far. */
  speedMs?: number | ((revealedSoFar: number) => number);
  className?: string;
  /** Merged with default paragraph styles; omit default min-height when using a scroll container. */
  contentClassName?: string;
  /** Fires after each newly revealed character (after DOM update). Passes visible character count. */
  onAfterRevealStep?: (revealedCount: number) => void;
  /** Visible element (sr-only duplicate still exposes full string to assistive tech). Default `p`. */
  as?: ElementType;
  /** Default `true`: keeps `min-h-[9rem]` for body copy. Set `false` for headings / one-liners. */
  reserveMinHeight?: boolean;
  /** Runs once when the final character is revealed. */
  onTypingComplete?: () => void;
};

/**
 * Reveals copy progressively for onboarding moments.
 */
export function OnboardingTypewriter({
  text,
  speedMs = 26,
  className,
  contentClassName,
  onAfterRevealStep,
  as: Comp = "p",
  reserveMinHeight = true,
  onTypingComplete,
}: Props) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;
  const tickRef = useRef(onAfterRevealStep);
  tickRef.current = onAfterRevealStep;
  const completeFiredRef = useRef(false);

  useEffect(() => {
    setCount(0);
    completeFiredRef.current = false;
  }, [text]);

  useEffect(() => {
    if (done) return;
    const delay =
      typeof speedMs === "function" ? speedMs(count) : (speedMs ?? 26);
    const id = window.setTimeout(() => {
      setCount((c) => Math.min(c + 1, text.length));
    }, delay);
    return () => window.clearTimeout(id);
  }, [count, done, text.length, speedMs]);

  useEffect(() => {
    if (!done || !onTypingComplete || completeFiredRef.current) return;
    completeFiredRef.current = true;
    onTypingComplete();
  }, [done, onTypingComplete]);

  useLayoutEffect(() => {
    if (!onAfterRevealStep) return;
    const run = () => tickRef.current?.(count);
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [count, onAfterRevealStep]);

  return (
    <div className={cn("relative", className)}>
      <p className="sr-only">{text}</p>
      <Comp
        className={cn(
          "text-sm leading-relaxed text-foreground pl-1.5",
          reserveMinHeight && "min-h-[9rem]",
          contentClassName,
        )}
        aria-hidden
      >
        {text.slice(0, count)}
        {!done ? (
          <span className="inline-block w-px h-[1.05em] ml-0.5 align-text-bottom bg-foreground animate-pulse" />
        ) : null}
      </Comp>
    </div>
  );
}
