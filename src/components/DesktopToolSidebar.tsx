import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDashboardFeatures } from "@/lib/featuresData";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Home, Settings as SettingsIcon, Smartphone, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomIcon } from "@/components/icons/CustomIcon";
import { DashboardToolIcon } from "@/components/dashboard/DashboardToolIcon";
import { useTheme, type Appearance } from "@/contexts/ThemeContext";
import {
  dashboardHomeUsesCosmicShell,
  webSidebarNavActiveClass,
  webSidebarNavIdleClass,
} from "@/lib/dashboardThemeStyles";

interface DesktopToolSidebarProps {
  className?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Sharper web-dashboard shell; tool pages keep default styling. */
  variant?: "default" | "web";
  /** When set, tool icons use neon wells and nav hovers match the active appearance. */
  appearance?: Appearance;
}

export const DesktopToolSidebar = ({
  className,
  onCollapsedChange,
  variant = "default",
  appearance: appearanceProp = "light",
}: DesktopToolSidebarProps) => {
  const { t } = useTranslation("dashboard");
  const dashboardFeatures = getDashboardFeatures(t);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const onDashboardRoute =
    location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const isCosmicChrome =
    dashboardHomeUsesCosmicShell(theme) && (location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/") || location.pathname === "/settings" || location.pathname.startsWith("/settings"));
  const isWebVariant = variant === "web" || isCosmicChrome;
  const appearance = isWebVariant ? theme : appearanceProp;
  const useThemedChrome = isWebVariant || appearance !== "light";
  const navActiveClass = useThemedChrome
    ? webSidebarNavActiveClass(appearance)
    : "bg-muted border border-primary/30";
  const navIdleClass = useThemedChrome
    ? webSidebarNavIdleClass(appearance)
    : "border border-transparent hover:bg-muted/50";
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r",
        isWebVariant
          ? "border-white/10 bg-[#0f0d14] text-white"
          : "border-border bg-gray-100 dark:bg-background",
        "fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Logo Header - Fixed height to match main content headers (desktop only) */}
      <div className={cn(
        "md:h-16 flex items-center border-b",
        isWebVariant ? "border-white/10" : "border-border",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!collapsed && (
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <h1
              className={cn(
                "text-lg font-bold",
                isWebVariant
                  ? "font-sans text-sm font-semibold tracking-tight text-white/90"
                  : "bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white",
              )}
            >
              Palette Plotting
            </h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn(
            "h-8 w-8",
            !collapsed && "ml-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <TooltipProvider delayDuration={300} skipDelayDuration={0} disableHoverableContent>
          {/* Dashboard Link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={cn(
                    "w-full flex items-center rounded-lg transition-all",
                    !isWebVariant && "hover:bg-muted/50",
                    "px-2 py-2.5 justify-center",
                    isActive("/dashboard") ? navActiveClass : navIdleClass,
                  )}
                >
                  <Home
                    className={cn(
                      "flex-shrink-0 h-4 w-4 stroke-[1.5]",
                      isWebVariant
                        ? isActive("/dashboard")
                          ? "text-white"
                          : "text-white/55"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t("mobileMenu.dashboard")}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate("/dashboard")}
              className={cn(
                "w-full flex items-center rounded-lg transition-all",
                !isWebVariant && "hover:bg-muted/50",
                "px-3 py-2.5 gap-3",
                isActive("/dashboard") ? navActiveClass : navIdleClass,
              )}
            >
              <Home
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isWebVariant ? "text-white/55" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isWebVariant
                    ? isActive("/dashboard")
                      ? "text-white"
                      : "text-white/55"
                    : isActive("/dashboard")
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {t("mobileMenu.dashboard")}
              </span>
            </button>
          )}

        {!collapsed && (
          <div className="pt-2 pb-1">
            <p
              className={cn(
                "px-3 text-xs font-semibold uppercase tracking-wider",
                isWebVariant ? "text-white/40" : "text-muted-foreground",
              )}
            >
              {t("sections.tools")}
            </p>
          </div>
        )}

          {/* Tool Links */}
          {dashboardFeatures
            .map((feature) => {
            const active = isActive(feature.path);
            const IconComponent = feature.icon;
            const isCustomIcon = IconComponent === CustomIcon;
            const isMusicIcon = IconComponent === Music;
            const isMirror = feature.path === "/dashboard/mirror";
            const showIcon = true;
            
            return collapsed ? (
              <Tooltip key={feature.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(feature.path)}
                    className={cn(
                      "w-full flex items-center rounded-lg transition-all",
                      !isWebVariant && "hover:bg-muted/50",
                      "px-2 py-2.5 justify-center",
                      active ? navActiveClass : navIdleClass,
                    )}
                  >
                    {showIcon && isCustomIcon && feature.iconSrc ? (
                      <div className="flex-shrink-0 h-4 w-4 opacity-60">
                        <CustomIcon 
                          src={feature.iconSrc} 
                          className="h-full w-full"
                        />
                      </div>
                    ) : showIcon && !isCustomIcon ? (
                      <DashboardToolIcon icon={IconComponent} theme={appearance} size="sm" />
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{feature.title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                key={feature.path}
                onClick={() => navigate(feature.path)}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all",
                  !useThemedChrome && "hover:bg-muted/50",
                  showIcon ? "pl-4 pr-3 py-2.5 gap-3" : "pl-14 pr-3 py-2.5",
                  active ? navActiveClass : navIdleClass,
                )}
              >
                {showIcon && isCustomIcon && feature.iconSrc ? (
                  <div 
                    className={cn(
                      "flex-shrink-0 opacity-60", 
                      isMirror ? "h-6 w-6" : "h-5 w-5"
                    )}
                  >
                    <CustomIcon 
                      src={feature.iconSrc} 
                      className="h-full w-full"
                    />
                  </div>
                ) : showIcon && !isCustomIcon ? (
                  <DashboardToolIcon icon={IconComponent} theme={appearance} size="sm" />
                ) : null}
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    isWebVariant
                      ? active
                        ? "text-white"
                        : "text-white/55"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {feature.title}
                </span>
              </button>
            );
          })}

          {!collapsed && (
            <div className="pt-4 pb-1">
              <p
                className={cn(
                  "px-3 text-xs font-semibold uppercase tracking-wider",
                  isWebVariant ? "text-white/40" : "text-muted-foreground",
                )}
              >
                {t("nav.settings")}
              </p>
            </div>
          )}

          {/* Your Account Link */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/settings")}
                  className={cn(
                    "w-full flex items-center rounded-lg transition-all",
                    !isWebVariant && "hover:bg-muted/50",
                    "px-2 py-2.5 justify-center",
                    isActive("/settings") ? navActiveClass : navIdleClass,
                  )}
                >
                  <SettingsIcon
                    className={cn(
                      "flex-shrink-0 h-4 w-4 stroke-[1.5]",
                      isWebVariant
                        ? isActive("/settings")
                          ? "text-white"
                          : "text-white/55"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t("profile.yourAccount")}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate("/settings")}
              className={cn(
                "w-full flex items-center rounded-lg transition-all",
                !isWebVariant && "hover:bg-muted/50",
                "pl-6 pr-3 py-2.5 gap-3",
                isActive("/settings") ? navActiveClass : navIdleClass,
              )}
            >
              <SettingsIcon
                className={cn(
                  "flex-shrink-0 h-5 w-5 stroke-[1.5]",
                  isWebVariant
                    ? isActive("/settings")
                      ? "text-white"
                      : "text-white/55"
                    : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isWebVariant
                    ? isActive("/settings")
                      ? "text-white"
                      : "text-white/55"
                    : isActive("/settings")
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {t("profile.yourAccount")}
              </span>
            </button>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/dashboard/get-app")}
                  className={cn(
                    "w-full flex items-center rounded-lg transition-all mt-1",
                    !isWebVariant && "hover:bg-muted/50",
                    "px-2 py-2.5 justify-center",
                    isActive("/dashboard/get-app") ? navActiveClass : navIdleClass,
                  )}
                >
                  <Smartphone
                    className={cn(
                      "flex-shrink-0 h-4 w-4 stroke-[1.5]",
                      isWebVariant
                        ? isActive("/dashboard/get-app")
                          ? "text-white"
                          : "text-white/55"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t("mobileMenu.getTheApp")}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate("/dashboard/get-app")}
              className={cn(
                "w-full flex items-center rounded-lg transition-all mt-1",
                !isWebVariant && "hover:bg-muted/50",
                "pl-6 pr-3 py-2.5 gap-3",
                isActive("/dashboard/get-app") ? navActiveClass : navIdleClass,
              )}
            >
              <Smartphone
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isWebVariant
                    ? isActive("/dashboard/get-app")
                      ? "text-white"
                      : "text-white/55"
                    : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isWebVariant
                    ? isActive("/dashboard/get-app")
                      ? "text-white"
                      : "text-white/55"
                    : isActive("/dashboard/get-app")
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {t("mobileMenu.getTheApp")}
              </span>
            </button>
          )}
        </TooltipProvider>
      </nav>
    </aside>
  );
};

