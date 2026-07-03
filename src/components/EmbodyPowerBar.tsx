import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { embodyProgressPercentForBar } from "@/lib/embodyDailyPower";

type EmbodyPowerBarProps = {
  checkpointsFilled: number;
  className?: string;
};

export function EmbodyPowerBar({ checkpointsFilled, className }: EmbodyPowerBarProps) {
  const c = Math.min(Math.max(checkpointsFilled, 0), 3);
  const full = c >= 3;
  const barValue = embodyProgressPercentForBar(c);

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative pt-1">
        <div className="flex justify-between px-0.5 mb-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 w-8 transition-all duration-300",
                i < c ? "scale-100" : "opacity-70"
              )}
            >
              <div
                className={cn(
                  "h-3 w-3 rotate-45 rounded-sm border-2 transition-all duration-300",
                  i < c
                    ? "border-violet-300 bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]"
                    : "border-muted-foreground/35 bg-background/80"
                )}
              />
            </div>
          ))}
        </div>

        <div
          className={cn(
            "rounded-full p-[3px] transition-all duration-500",
            full &&
              "shadow-[0_0_22px_rgba(167,139,250,0.55),0_0_40px_rgba(232,121,249,0.38),0_0_4px_rgba(250,250,250,0.4)_inset] ring-2 ring-fuchsia-400/35"
          )}
        >
          <Progress
            value={barValue}
            className={cn(
              "h-3.5 rounded-full bg-muted/55 dark:bg-muted/35 overflow-hidden",
              "[&>div]:transition-all [&>div]:duration-500 [&>div]:ease-out",
              "[&>div]:rounded-full [&>div]:bg-gradient-to-r [&>div]:from-violet-400 [&>div]:via-fuchsia-400 [&>div]:to-pink-400",
              full && "[&>div]:brightness-110 [&>div]:shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            )}
          />
        </div>
      </div>
    </div>
  );
}
