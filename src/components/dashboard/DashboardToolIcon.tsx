import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import type { Appearance } from "@/contexts/ThemeContext";
import {
  dashboardHomeUsesCosmicShell,
  dashboardToolIconClass,
  dashboardToolIconWellClass,
  webDashboardUsesCosmicTileStyle,
} from "@/lib/dashboardThemeStyles";

type DashboardToolIconProps = {
  icon: LucideIcon | IconType;
  theme: Appearance;
  size?: "sm" | "md";
  className?: string;
  isMobileDashboard?: boolean;
};

export function DashboardToolIcon({
  icon: Icon,
  theme,
  size = "md",
  className,
  isMobileDashboard = false,
}: DashboardToolIconProps) {
  const onCosmic =
    dashboardHomeUsesCosmicShell(theme) &&
    (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme));
  const wellSize = onCosmic
    ? size === "sm"
      ? "h-8 w-8 shrink-0"
      : "h-10 w-10 shrink-0 sm:h-11 sm:w-11"
    : size === "sm"
      ? "h-8 w-8 p-1"
      : "h-10 w-10 p-1.5 sm:h-12 sm:w-12";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-5 w-5 sm:h-6 sm:w-6";

  return (
    <span className={cn(dashboardToolIconWellClass(theme, isMobileDashboard), wellSize, className)}>
      <Icon
        className={cn(
          iconSize,
          onCosmic ? "text-white/90" : dashboardToolIconClass(theme, isMobileDashboard),
        )}
        strokeWidth={1.5}
      />
    </span>
  );
}
