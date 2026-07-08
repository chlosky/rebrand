import { cn } from "@/lib/utils";

type MobileBottomInletProps = {
  className?: string;
};

export function MobileBottomInlet({ className }: MobileBottomInletProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[39] bg-[#f3f0eb] md:hidden",
        className,
      )}
      style={{ height: "env(safe-area-inset-bottom, 0px)" }}
    />
  );
}
