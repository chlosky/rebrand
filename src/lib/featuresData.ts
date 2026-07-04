import { Bell, LayoutGrid, type LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import type { TFunction } from "i18next";

export interface Feature {
  icon: LucideIcon | IconType;
  title: string;
  description: string;
  path: string;
}

export function getDashboardFeatures(t: TFunction<"dashboard">): Feature[] {
  return [
    {
      icon: LayoutGrid,
      title: t("tools.boards.title"),
      description: t("tools.boards.description"),
      path: "/dashboard/boards",
    },
    {
      icon: Bell,
      title: t("tools.yourJourney.title"),
      description: t("tools.yourJourney.description"),
      path: "/dashboard/reminders",
    },
  ];
}

export interface SupportReportToolOption {
  value: string;
  label: string;
}

export function getSupportReportToolOptions(t: TFunction<"dashboard">): SupportReportToolOption[] {
  return [
    ...getDashboardFeatures(t).map((f) => ({ value: f.path, label: f.title })),
    { value: "/dashboard/activity-tracking", label: t("supportTools.activityTracking") },
    { value: "/dashboard/timeline", label: t("supportTools.journal") },
    { value: "settings", label: t("supportTools.settingsAccount") },
    { value: "billing", label: t("supportTools.billing") },
    { value: "other", label: t("supportTools.other") },
  ];
}

export function getBillingPurchaseChannelOptions(t: TFunction<"dashboard">) {
  return [
    { value: "apple_app_store", label: t("billingChannels.apple") },
    { value: "google_play", label: t("billingChannels.googlePlay") },
    { value: "web", label: t("billingChannels.web") },
  ];
}
