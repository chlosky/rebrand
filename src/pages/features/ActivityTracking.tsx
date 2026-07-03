import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { ManifestationMilestonesTabs } from "@/components/ManifestationMilestonesTabs";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const ActivityTracking: React.FC = () => {
  const { t } = useTranslation("tools");
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden flex flex-col pb-24 md:pb-8",
        theme === "dark" ? "text-white bg-[#0f0d14] min-h-screen" : "text-foreground bg-background min-h-screen bg-background",
        isMobile ? "min-h-[100dvh]" : "min-h-screen",
      )}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile ? (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <header
            className={cn(
              "md:h-16 flex items-center md:py-0 z-50 border-b",
              theme === "dark" ? "py-2.5 border-white/10 border-b border-white/10 bg-[#0f0d14]" : "py-3 border-primary/10 bg-background",
              isMobile
                ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]"
                : "fixed top-0 left-0 right-0",
            )}
            style={
              isMobile
                ? { backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }
                : {
                    backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff",
                    top: "var(--app-safe-area-top)",
                    left: sidebarCollapsed ? "64px" : "256px",
                    right: "0",
                    transition: "left 300ms ease-in-out",
                  }
            }
          >
            <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
              <div className="flex items-center justify-between">
                <h1
                  className={cn(
                    "text-lg font-bold cursor-pointer hover:opacity-80 transition-opacity supports-[hover:hover]:hover:opacity-80",
                    theme === "dark" ? "text-white" : "text-foreground",
                  )}
                  onClick={() => navigate("/dashboard/double")}
                >
                  {t("activity.title")}
                </h1>
                {isMobile && <MobilePWAMenu />}
              </div>
            </div>
          </header>

          <main
            className={cn(
              "px-4 sm:px-6 max-w-4xl",
              isMobile ? "pb-4" : "pb-20",
              !isMobile ? "pt-16" : "",
              !isMobile ? "" : "container mx-auto",
              isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
            )}
          >
            <div className="py-2 sm:py-3">
              <ManifestationMilestonesTabs syncHash />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ActivityTracking;
