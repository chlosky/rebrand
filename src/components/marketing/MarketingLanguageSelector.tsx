import { Globe } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isMarketingSitePath } from "@/lib/siteRoutes";
import { MARKETING_LANGUAGE_OPTIONS } from "@/lib/marketingLocale";
import { useMarketingLocaleContext } from "@/contexts/MarketingLocaleContext";

type MarketingLanguageSelectorProps = {
  className?: string;
};

export function MarketingLanguageSelector({ className }: MarketingLanguageSelectorProps) {
  const { pathname } = useLocation();
  const { marketingLocale, setMarketingLocale } = useMarketingLocaleContext();

  if (Capacitor.isNativePlatform() || !isMarketingSitePath(pathname)) return null;

  const activeLabel =
    MARKETING_LANGUAGE_OPTIONS.find((opt) => opt.code === marketingLocale)?.label ?? "Language";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "inline-flex h-8 shrink-0 gap-1.5 px-2 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white sm:px-2.5 sm:text-sm",
            className,
          )}
          aria-label={`Language: ${activeLabel}`}
        >
          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          <span className="hidden max-w-[5.5rem] truncate sm:inline">{activeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {MARKETING_LANGUAGE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.code}
            onClick={() => setMarketingLocale(opt.code)}
            className={cn(marketingLocale === opt.code && "font-semibold")}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
