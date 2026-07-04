import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PALETTE_PLOTTING_APP_STORE_URL } from "@/lib/appStore";
import { cn } from "@/lib/utils";

type QRStatus = "loading" | "ready" | "error";

const GetAppStore: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [qrData, setQrData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<QRStatus>("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(PALETTE_PLOTTING_APP_STORE_URL, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((dataUrl) => {
        setQrData(dataUrl);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("QR generation failed", err);
        setError("Could not generate QR code. Use the App Store button below.");
        setStatus("error");
      });
  }, []);

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
          Scan this QR code with your phone to open Palette Plotting on the App Store.
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        {status === "ready" && qrData && (
          <a
            href={PALETTE_PLOTTING_APP_STORE_URL}
            rel="noopener noreferrer"
            className="rounded-xl bg-white p-3 shadow-md border border-gray-200"
          >
            <img
              src={qrData}
              alt="QR code to open Palette Plotting on the App Store"
              className="h-64 w-64"
            />
          </a>
        )}
        {status === "loading" && (
          <div className="h-64 w-64 flex items-center justify-center rounded-xl border border-dashed border-white/20 text-white/55 bg-transparent">
            Generating…
          </div>
        )}
        {status === "error" && (
          <div className="h-64 w-64 flex items-center justify-center rounded-xl border border-dashed border-red-400/50 text-red-400 bg-transparent">
            QR unavailable
          </div>
        )}
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          className={cn(
            theme === "dark"
              ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50"
              : "bg-card text-card-foreground border border-border/50 hover:bg-card/90 hover:text-card-foreground active:text-card-foreground focus-visible:text-card-foreground",
          )}
        >
          <a href={PALETTE_PLOTTING_APP_STORE_URL} rel="noopener noreferrer">
            Open App Store
          </a>
        </Button>
        <Button
          variant="outline"
          className={cn(
            theme === "dark"
              ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50"
              : "bg-card text-card-foreground border border-border/50 hover:bg-card/90 hover:text-card-foreground active:text-card-foreground focus-visible:text-card-foreground",
          )}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(PALETTE_PLOTTING_APP_STORE_URL);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
              setError("Copy failed. Please copy the App Store link manually.");
            }
          }}
        >
          {copied ? "Copied!" : "Copy App Store link"}
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
            Palette Plotting is available on the App Store.
          </p>
          <Button
            asChild
            size="lg"
            className={cn(
              theme === "dark"
                ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50"
                : "bg-card text-card-foreground border border-border/50 hover:bg-card/90 hover:text-card-foreground active:text-card-foreground focus-visible:text-card-foreground",
            )}
          >
            <a href={PALETTE_PLOTTING_APP_STORE_URL} rel="noopener noreferrer">
              Download on the App Store
            </a>
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
