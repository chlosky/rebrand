import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { ManifestationMilestonesTabs } from "@/components/ManifestationMilestonesTabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

export default function YourJourney() {
  const { t } = useTranslation(["tools", "dashboard"]);
  const isMobile = useIsMobile();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const [loading, setLoading] = useState(true);

  const isStandalone =
    (typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)) ||
    Capacitor.isNativePlatform();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("tools:journey.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t]);

  useEffect(() => {
    if (!authLoading && user === null) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await supabase.from("manifestation_power_daily_signals").select("signal_kind").eq("user_id", user.id).limit(1);
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      void load();
    }
  }, [authLoading, load]);

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden",
        theme === "dark" ? "min-h-screen text-white bg-[#0f0d14]" : "min-h-screen text-foreground bg-background",
        "pb-24 md:pb-8",
      )}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
          <header
            className={cn(
              "md:h-16 flex items-center md:py-0 z-50 border-b",
              theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10",
              theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background",
              isMobile
                ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]"
                : "fixed top-0 left-0 right-0",
            )}
            style={
              isMobile
                ? theme === "dark"
                  ? { backgroundColor: "#0f0d14" }
                  : { backgroundColor: "#ffffff" }
                : {
                    ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }),
                    top: "var(--app-safe-area-top)",
                    left: sidebarCollapsed ? "64px" : "256px",
                    right: "0",
                    transition: "left 300ms ease-in-out",
                  }
            }
          >
            <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
              <div className="flex items-center justify-between gap-2">
                <h1
                  className={cn(
                    theme === "dark"
                      ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
                      : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity",
                    "truncate",
                  )}
                  onClick={() => navigate("/dashboard")}
                >
                  {t("tools:journey.title")}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  {isMobile && <MobilePWAMenu />}
                </div>
              </div>
            </div>
          </header>

          <main
            className={cn(
              "px-4 sm:px-6 max-w-xl space-y-2 pt-3 sm:pt-4 pb-3",
              !isMobile ? "" : "container mx-auto",
            )}
          >
            <div className="py-2 sm:py-3">
              <p className={cn("text-sm mb-2 leading-snug", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("tools:journey.subtitle")}
              </p>
              <h2 className={cn("text-lg font-bold tracking-tight", theme === "dark" ? "text-white" : "text-foreground")}>
                {t("tools:journey.yourProgress")}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Card
                  className={cn(
                    "space-y-4 overflow-hidden rounded-xl px-5 py-5 shadow-sm",
                    theme === "dark"
                      ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm"
                      : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
                  )}
                >
                  <ManifestationMilestonesTabs syncHash={false} />
                </Card>

                <Button
                  variant="outline"
                  className={cn(
                    "h-auto w-full justify-between py-4 transition-colors",
                    theme === "dark"
                      ? cn(
                          "rounded-2xl border border-white/12 bg-transparent text-white transition-colors hover:bg-white/[0.06]",
                        )
                      : "rounded-2xl border border-zinc-200/75 bg-card/75 backdrop-blur-sm hover:bg-card/90",
                  )}
                  onClick={() => navigate("/dashboard/chrono")}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                        theme === "dark"
                          ? "border-white/12 bg-transparent text-white"
                          : "bg-zinc-50/90 text-foreground border-zinc-200/80",
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <span className="text-left">
                      <div className={cn("text-sm font-semibold", theme === "dark" ? "text-white" : "text-foreground")}>
                        {t("tools:journey.journalTitle")}
                      </div>
                      <div className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {t("tools:journey.journalDescription")}
                      </div>
                    </span>
                  </span>
                  <ChevronRight className={cn("h-5 w-5", theme === "dark" ? "text-white/55" : "text-muted-foreground")} />
                </Button>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
