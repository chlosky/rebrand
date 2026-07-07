import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const GetAppStore: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const qrCard = (
    <Card
      className={cn(
        "max-w-xl w-full p-6",
        theme === "dark" &&
          "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm",
      )}
    >
      <div className="text-center space-y-3">
        <h1
          className={cn(
            "text-2xl font-semibold",
            theme === "dark" ? "text-white" : "text-foreground",
          )}
        >
          Get the app
        </h1>
        <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
          The mobile app is not publicly available yet. Use Palette Plotting on the web for now.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          className={cn(
            theme === "dark"
              ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50"
              : "bg-card text-card-foreground border border-border/50 hover:bg-card/90 hover:text-card-foreground active:text-card-foreground focus-visible:text-card-foreground",
          )}
          onClick={() => navigate("/dashboard")}
        >
          Continue on web
        </Button>
      </div>
    </Card>
  );

  if (isMobile) {
    return (
      <div
        className={cn(
          "tool-page-shell relative overflow-x-hidden min-h-screen flex items-center justify-center px-6 text-center",
          theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
        )}
        style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
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
        <div className="max-w-md space-y-4">
          <h1
            className={cn(
              "text-xl font-semibold",
              theme === "dark" ? "text-white" : "text-foreground",
            )}
          >
            Get the app
          </h1>
          <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            The mobile app is not publicly available yet. Use Palette Plotting on the web for now.
          </p>
          <Button
            size="lg"
            className={cn(
              theme === "dark"
                ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50"
                : "bg-card text-card-foreground border border-border/50 hover:bg-card/90 hover:text-card-foreground active:text-card-foreground focus-visible:text-card-foreground",
            )}
            onClick={() => navigate("/dashboard")}
          >
            Continue on web
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden min-h-screen",
        theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background min-h-screen bg-background",
      )}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        {qrCard}
      </div>
    </div>
  );
};

export default GetAppStore;
