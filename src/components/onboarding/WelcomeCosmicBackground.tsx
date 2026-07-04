import { cn } from "@/lib/utils";

export const WELCOME_LIGHT_BASE = "#ffffff";
export const WELCOME_LIGHT_SHELL_BG = "#ffffff";

/** Flat white background for onboarding and auth shells. */
export function WelcomeCosmicBackground({ className }: { className?: string }) {
  return <div className={cn(className, "bg-white")} aria-hidden />;
}
