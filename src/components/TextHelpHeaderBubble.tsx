import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { manifestSmsHref } from "@/lib/marketingContact";

type TextHelpHeaderBubbleProps = {
  /** Light text + visible outline on dark marketing hero header. Default keeps light-page styling. */
  variant?: "default" | "on-dark";
};

/** Compact CTA for /help/manifesting — beside Login (logged out) or left of Dashboard (logged in, marketing header). */
export function TextHelpHeaderBubble({ variant = "default" }: TextHelpHeaderBubbleProps) {
  const onDark = variant === "on-dark";

  return (
    <a href={manifestSmsHref} className="inline-flex items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 shrink-0 rounded-full px-2 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium",
          onDark
            ? cn(
                "border-2 border-white/60 bg-white/5 text-white shadow-sm",
                "hover:bg-white/12 hover:text-white active:text-white focus-visible:text-white",
                "[&_svg]:text-white",
              )
            : cn(
                "border-primary/30 bg-primary/[0.06] shadow-sm",
                "!text-foreground hover:!text-foreground active:!text-foreground focus-visible:!text-foreground",
                "hover:bg-primary/12 active:bg-primary/[0.14]",
                "[&_svg]:!text-foreground [&_svg]:opacity-90 hover:[&_svg]:!text-foreground active:[&_svg]:!text-foreground",
              ),
        )}
      >
        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
        <span>Text us</span>
      </Button>
    </a>
  );
}
