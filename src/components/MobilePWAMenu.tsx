import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Settings as SettingsIcon, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDashboardFeatures } from "@/lib/featuresData";
import { useTranslation } from "react-i18next";
import { CustomIcon } from "@/components/icons/CustomIcon";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";

export const MobilePWAMenu = () => {
  const { t } = useTranslation("dashboard");
  const dashboardFeatures = getDashboardFeatures(t);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  // Show on mobile devices that are NOT in standalone/add-to-home-screen mode
  // This means it's running in a mobile browser (PWA browser mode)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  
  // Don't show on bare /dashboard (redirects to boards).
  const isDashboardRoot =
    location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  const isToolPage =
    location.pathname.startsWith("/dashboard/") &&
    !isDashboardRoot &&
    location.pathname !== "/dashboard/settings";

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Only show on mobile, on tool pages (not dashboard/category lists).
  // Show in both browser mode and standalone mode for better navigation
  if (!isMobile || isDashboardRoot || !isToolPage) return null;

  return (
    <div className="relative">
      {/* Hamburger Button - Transparent, no outline - positioned relative to header */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[1002] h-9 w-9 hover:bg-transparent active:bg-transparent focus:bg-transparent"
        aria-label={t("mobileMenu.toggleAria")}
      >
        {isOpen ? (
          <X className={cn("h-5 w-5", theme === "dark" ? "text-white" : "text-foreground")} />
        ) : (
          <Menu className={cn("h-5 w-5", theme === "dark" ? "text-white" : "text-foreground")} />
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute right-0 top-full mt-2 z-[1001] w-64 max-h-[calc(100vh-5rem)] overflow-hidden rounded-2xl shadow-2xl",
            isToolPage
              ? theme === "dark" ? "border border-white/10 bg-[#0f0d14] text-white backdrop-blur-xl" : "bg-gray-100/95 backdrop-blur-xl"
              : "border border-white/25 bg-white/95 dark:bg-background/95 backdrop-blur-xl backdrop-saturate-150",
          )}
        >
            <div className="overflow-y-auto max-h-[calc(100vh-5rem)]">
              {/* Tools Section Header */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sections.tools")}
                </p>
              </div>

              {/* Tool Links */}
              {dashboardFeatures
                .map((feature) => {
                  const active = isActive(feature.path);
                  const IconComponent = feature.icon;
                  const isCustomIcon = IconComponent === CustomIcon;

                  return (
                    <button
                      key={feature.path}
                      onClick={() => handleNavigate(feature.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        active
                          ? "text-foreground"
                          : isToolPage
                            ? "text-muted-foreground hover:bg-muted/50"
                            : "text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      {isCustomIcon && feature.iconSrc ? (
                        <div className="h-5 w-5 flex-shrink-0 opacity-60">
                          <CustomIcon 
                            src={feature.iconSrc} 
                            className="h-full w-full"
                          />
                        </div>
                      ) : IconComponent && IconComponent !== CustomIcon && typeof IconComponent !== 'string' ? (
                        React.createElement(IconComponent as React.ComponentType<{ className?: string }>, { className: "h-5 w-5 flex-shrink-0 text-muted-foreground" })
                      ) : null}
                      <span className="text-sm font-medium truncate">{feature.title}</span>
                    </button>
                  );
                })}

              {/* Divider */}
              <div className={cn("border-t my-1", isToolPage ? "border-border/30" : "border-white/10")} />

              {/* Settings Section Header */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("nav.settings")}
                </p>
              </div>

              {/* Your Account Link */}
              <button
                onClick={() => handleNavigate("/settings")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  isActive("/settings")
                    ? "text-foreground"
                    : isToolPage
                      ? "text-muted-foreground hover:bg-muted/50"
                      : "text-muted-foreground hover:bg-white/10"
                )}
              >
                <SettingsIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{t("profile.yourAccount")}</span>
              </button>

              {/* Get App Link */}
              <button
                onClick={() => handleNavigate("/dashboard/settings")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  isActive("/dashboard/settings")
                    ? "text-foreground"
                    : isToolPage
                      ? "text-muted-foreground hover:bg-muted/50"
                      : "text-muted-foreground hover:bg-white/10"
                )}
              >
                <Smartphone className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{t("mobileMenu.getApp")}</span>
              </button>
            </div>
          </div>
      )}
    </div>
  );
};

