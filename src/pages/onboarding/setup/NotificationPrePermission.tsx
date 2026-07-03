import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { TrackingAuthorization } from "@/plugins/trackingAuthorization";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SetupNotificationPrePermission() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showTrackingPermission = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const [trackingChoice, setTrackingChoice] = useState<"yes" | "no" | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackingAskedAt, setTrackingAskedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!showTrackingPermission) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [navigate, setupBase, showTrackingPermission]);

  const requestTrackingPermission = async () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("yes");
    setTrackingAskedAt(askedAt);

    if (!showTrackingPermission) {
      return;
    }

    try {
      const result = await TrackingAuthorization.request();
      setTrackingStatus(result.status);
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: result.status,
        trackingPermissionAskedAt: askedAt,
      });
      console.log("[TrackingAuthorization] status:", result.status);
    } catch (error) {
      setTrackingStatus("unknown");
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: "unknown",
        trackingPermissionAskedAt: askedAt,
      });
      console.warn("[TrackingAuthorization] request failed:", error);
    }
  };

  const declineTrackingPermission = () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("no");
    setTrackingStatus("notRequested");
    setTrackingAskedAt(askedAt);
    void writeSetupDraft({
      trackingPrePermissionChoice: "no",
      trackingAuthorizationStatus: "notRequested",
      trackingPermissionAskedAt: askedAt,
    });
  };

  if (!showTrackingPermission) {
    return null;
  }

  return (
    <SetupPage
      canContinue={trackingChoice !== null}
      onBack={() => navigate(`${setupBase}/intensity`)}
      onContinue={() => {
        const d = readSetupDraft();
        writeSetupDraft({
          trackingPrePermissionChoice: trackingChoice ?? d.trackingPrePermissionChoice ?? null,
          trackingAuthorizationStatus: trackingStatus ?? d.trackingAuthorizationStatus ?? null,
          trackingPermissionAskedAt: trackingAskedAt ?? d.trackingPermissionAskedAt ?? null,
        });
        navigate(`${setupBase}/tool-preference`);
      }}
      continueText="Continue"
    >
      <SetupHeadingBlock
        centered
        title={t("setup.notifications.title")}
        subtitle={t("setup.notifications.subtitle")}
      />

      <div className="relative z-[1] pt-[1.125rem] space-y-3">
        <div className="space-y-3">
          <div className="space-y-1 pb-1">
            <p className="font-sans text-sm font-semibold text-zinc-900">
              {t("setup.tracking.title")}
            </p>
            <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
              {t("setup.tracking.body")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => requestTrackingPermission()}
              className={setupTextChoiceTileClass(trackingChoice === "yes")}
              style={trackingChoice === "yes" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t("setup.tracking.yes")}</span>
              {trackingChoice === "yes" ? (
                <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
              ) : (
                <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
              )}
            </button>
            <button
              type="button"
              onClick={declineTrackingPermission}
              className={setupTextChoiceTileClass(trackingChoice === "no")}
              style={trackingChoice === "no" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t("setup.tracking.no")}</span>
              {trackingChoice === "no" ? (
                <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
              ) : (
                <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
              )}
            </button>
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
