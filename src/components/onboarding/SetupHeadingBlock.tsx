import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SETUP_HEADING_SUBTITLE_CLASS,
  SETUP_HEADING_TITLE_CLASS,
} from "@/lib/onboardingSetupTheme";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  centered?: boolean;
};

export function SetupHeadingBlock({
  title,
  subtitle,
  className,
  subtitleClassName,
  titleClassName,
  centered,
}: Props) {
  const centerClass = centered ? "text-center" : undefined;
  return (
    <div className={cn("space-y-2", centerClass, className)}>
      <h1 className={cn(SETUP_HEADING_TITLE_CLASS, centerClass, titleClassName)}>{title}</h1>
      {subtitle != null ? (
        <div
          className={cn(SETUP_HEADING_SUBTITLE_CLASS, "[&_p]:mb-0", centerClass, subtitleClassName)}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
